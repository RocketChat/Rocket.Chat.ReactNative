import { InteractionManager } from 'react-native';
import RNCallKeep from 'react-native-callkeep';
import I18n from 'i18n-js';
import { all, call, delay, put, take, takeLatest } from 'typed-redux-saga';

import { shareSetParams } from '../actions/share';
import * as types from '../actions/actionsTypes';
import { appInit, appStart, appReady } from '../actions/app';
import { inviteLinksRequest, inviteLinksSetToken } from '../actions/inviteLinks';
import { loginRequest } from '../actions/login';
import { selectServerRequest, serverInitAdd } from '../actions/server';
import { RootEnum, SubscriptionType } from '../definitions';
import { CURRENT_SERVER, TOKEN_KEY } from '../lib/constants/keys';
import database from '../lib/database';
import { getServerById } from '../lib/database/services/Server';
import { canOpenRoom } from '../lib/methods/canOpenRoom';
import { getServerInfo } from '../lib/methods/getServerInfo';
import { getUidDirectMessage, normalizeDeepLinkingServerHost } from '../lib/methods/helpers';
import EventEmitter from '../lib/methods/helpers/events';
import { goRoom, navigateToRoom } from '../lib/methods/helpers/goRoom';
import { getIsMasterDetail } from '../lib/hooks/useMasterDetail';
import { localAuthenticate } from '../lib/methods/helpers/localAuthentication';
import log from '../lib/methods/helpers/log';
import { showToast } from '../lib/methods/helpers/showToast';
import UserPreferences from '../lib/methods/userPreferences';
import { videoConfJoin } from '../lib/methods/videoConf';
import { loginOAuthOrSso } from '../lib/services/connect';
import { notifyUser } from '../lib/services/restApi';
import sdk from '../lib/services/sdk';
import { waitForNavigationReady } from '../lib/navigation/appNavigation';
import { resetVoipState } from '../lib/services/voip/resetVoipState';
import { appSelector } from '../lib/hooks/useAppSelector';
import { type IParams } from '../actions/deepLinking';

const roomTypes = {
	channel: SubscriptionType.CHANNEL,
	direct: SubscriptionType.DIRECT,
	group: SubscriptionType.GROUP,
	channels: SubscriptionType.OMNICHANNEL
} as const;

type TRoomTypeKey = keyof typeof roomTypes;

const handleInviteLink = function* handleInviteLink({
	params,
	requireLogin = false
}: {
	params: Partial<IParams>;
	requireLogin?: boolean;
}) {
	if (params.path && params.path.startsWith('invite/')) {
		const token = params.path.replace('invite/', '');
		if (requireLogin) {
			yield* put(inviteLinksSetToken(token));
		} else {
			yield* put(inviteLinksRequest(token));
		}
	}
};

const navigate = function* navigate({ params }: { params: Partial<IParams> }) {
	if (params.path || params.rid) {
		let type: string | undefined;
		let name: string | undefined;
		let jumpToThreadId: string | undefined;
		if (params.path) {
			// Following this pattern: {channelType}/{channelName}/thread/{threadId}
			const pathParts = params.path.split('/');
			type = pathParts[0];
			name = pathParts[1];
			jumpToThreadId = pathParts[3];
		}
		if (type !== 'invite' || params.rid) {
			const room = yield* call(canOpenRoom, {
				rid: params.rid || '',
				path: params.path || ''
			});
			if (room) {
				const item = {
					name,
					t: type && type in roomTypes ? roomTypes[type as TRoomTypeKey] : undefined,
					roomUserId: getUidDirectMessage(room),
					...room
				};

				const isMasterDetail = getIsMasterDetail();
				const jumpToMessageId = params.messageId;
				yield* call(waitForNavigationReady);
				yield* call(goRoom, { item, isMasterDetail, jumpToMessageId, jumpToThreadId });
			}
		} else {
			yield* call(handleInviteLink, { params });
		}
	}
	yield* put(appStart({ root: RootEnum.ROOT_INSIDE }));
};

/**
 * After native VoIP accept fails: reset call state, end CallKit session, land inside root,
 * optionally open DM via same pipeline as deep links (`direct/username`), then toast/dialog per a11y.
 */
const handleVoipAcceptFailed = function* handleVoipAcceptFailed(params: Partial<IParams>) {
	try {
		const { callId, username } = params;
		resetVoipState();
		if (callId) {
			RNCallKeep.endCall(callId);
		}

		yield* call(waitForNavigationReady);

		const navigateParams: Partial<IParams> = {
			...params,
			path: username ? `direct/${username}` : params.path
		};
		yield* call(navigate, { params: navigateParams });

		yield* call(
			() =>
				new Promise<void>(resolve => {
					InteractionManager.runAfterInteractions(() => resolve());
				})
		);

		showToast(I18n.t('VoIP_Call_Issue'));
	} catch (e) {
		log(e);
	}
};

const completeDeepLinkNavigation = function* completeDeepLinkNavigation(params: Partial<IParams>) {
	if (params.voipAcceptFailed) {
		yield* call(handleVoipAcceptFailed, params);
	} else {
		yield* call(navigate, { params });
	}
};

const fallbackNavigation = function* fallbackNavigation() {
	const currentRoot = yield* appSelector(state => state.app.root);
	if (currentRoot) {
		return;
	}
	yield* put(appInit());
};

interface IOAuthParams {
	credentialToken?: string;
	credentialSecret?: string;
}

const handleOAuth = function* handleOAuth({ params }: { params: IOAuthParams }) {
	const { credentialToken, credentialSecret } = params;
	try {
		if (credentialToken && credentialSecret) {
			yield* call(loginOAuthOrSso, { oauth: { credentialToken, credentialSecret } }, false);
		}
	} catch (e) {
		log(e);
	}
};

const handleShareExtension = function* handleShareExtension({ params }: { params: Partial<IParams> }) {
	const server = UserPreferences.getString(CURRENT_SERVER);
	if (!server) {
		yield* put(appInit());
		return;
	}
	const user = UserPreferences.getString(`${TOKEN_KEY}-${server}`);

	if (!user) {
		yield* put(appInit());
		return;
	}

	yield* put(appStart({ root: RootEnum.ROOT_LOADING_SHARE_EXTENSION }));
	yield* call(localAuthenticate, server);
	const serverRecord = yield* call(getServerById, server);
	if (!serverRecord) {
		return;
	}
	yield* put(selectServerRequest(server, serverRecord.version));
	if (sdk.current?.client?.host !== server) {
		yield* take(types.LOGIN.SUCCESS);
	}
	yield* put(shareSetParams(params));
	yield* put(appStart({ root: RootEnum.ROOT_SHARE_EXTENSION }));
};

const handleOpen = function* handleOpen({ params }: { params: Partial<IParams> }) {
	if (params.type === 'shareextension') {
		yield* call(handleShareExtension, { params });
		return;
	}
	if (params.type === 'oauth') {
		yield* call(handleOAuth, { params: params as IOAuthParams });
		return;
	}

	// If there's no host on the deep link params and the app is opened, just call appInit()
	let { host } = params;
	if (!host) {
		if (params.voipAcceptFailed) {
			yield* call(handleVoipAcceptFailed, params);
			return;
		}
		yield* call(fallbackNavigation);
		return;
	}

	// If there's host, continue
	host = normalizeDeepLinkingServerHost(host);
	params.host = host;

	const server = UserPreferences.getString(CURRENT_SERVER);
	const user = UserPreferences.getString(`${TOKEN_KEY}-${host}`);

	const serverRecord = yield* call(getServerById, host);

	// TODO: needs better test
	// if deep link is from same server
	if (server === host && user && serverRecord) {
		const connected = yield* appSelector(state => state.server.connected);
		if (!connected) {
			yield* call(localAuthenticate, host);
			yield* put(selectServerRequest(host, serverRecord.version, true));
			yield* take(types.LOGIN.SUCCESS);
		}
		yield* call(completeDeepLinkNavigation, params);
	} else {
		// search if deep link's server already exists
		try {
			if (user && serverRecord) {
				yield* call(localAuthenticate, host);
				yield* put(selectServerRequest(host, serverRecord.version, true, true));
				yield* take(types.LOGIN.SUCCESS);
				yield* call(completeDeepLinkNavigation, params);
				return;
			}
		} catch (e) {
			// do nothing?
		}
		// if deep link is from a different server
		const result = yield* call(getServerInfo, host);
		if (!result.success) {
			if (params.voipAcceptFailed) {
				yield* call(handleVoipAcceptFailed, params);
				return;
			}
			// Fallback to prevent the app from being stuck on splash screen
			yield* call(fallbackNavigation);
			return;
		}
		// if the host is different from the current one, we need to connect to it before navigating
		const hostAlreadyConnected = sdk.current?.client?.host === host;
		if (!hostAlreadyConnected) {
			yield* put(appStart({ root: RootEnum.ROOT_OUTSIDE }));
			if (server) {
				yield* put(serverInitAdd(server));
			}
			yield* delay(1000);
			EventEmitter.emit('NewServer', { server: host });
		}

		if (params.token) {
			if (!hostAlreadyConnected) {
				yield* take(types.SERVER.SELECT_SUCCESS);
				// SERVER.SELECT_SUCCESS doesn't mean 'connected'; skip the take if it already is.
				const connected = yield* appSelector(state => state.meteor.connected);
				if (!connected) {
					yield* take(types.METEOR.SUCCESS);
				}
			}
			yield* put(loginRequest({ resume: params.token }, true));
			yield* take(types.LOGIN.SUCCESS);
			yield* put(appReady());
			// Wait for the login saga's appStart(ROOT_INSIDE) before navigating, so
			// InsideStack is mounted and goRoom dispatches into the correct stack.
			const currentRoot = yield* appSelector(state => state.app.root);
			if (currentRoot !== RootEnum.ROOT_INSIDE) {
				yield* take(
					(action: any) => action.type === types.APP.START && action.root === RootEnum.ROOT_INSIDE
				);
			}
			yield* call(completeDeepLinkNavigation, params);
		} else {
			yield* call(handleInviteLink, { params, requireLogin: true });
		}
	}
};

interface ICallPushParams {
	host?: string;
	rid: string;
	token?: string;
	caller?: {
		_id: string;
	};
	callId: string;
	event: string;
}

const handleNavigateCallRoom = function* handleNavigateCallRoom({ params }: { params: ICallPushParams }) {
	try {
		yield* put(appStart({ root: RootEnum.ROOT_INSIDE }));
		const db = database.active;
		const subsCollection = db.get('subscriptions');
		const room = yield* call([subsCollection, 'find'], params.rid);
		if (room) {
			const isMasterDetail = getIsMasterDetail();
			yield* call(navigateToRoom, { item: room as any, isMasterDetail });
			const uid = params.caller?._id;
			const { rid, callId, event } = params;
			if (event === 'accept' && uid) {
				yield* call(notifyUser, `${uid}/video-conference`, {
					action: 'accepted',
					params: { uid, rid, callId }
				});
				yield* call(videoConfJoin, callId, true, false, true);
			} else if (event === 'decline' && uid) {
				yield* call(notifyUser, `${uid}/video-conference`, {
					action: 'rejected',
					params: { uid, rid, callId }
				});
			}
		}
	} catch (e) {
		log(e);
	}
};

const handleClickCallPush = function* handleClickCallPush({ params }: { params: ICallPushParams }) {
	let { host } = params;

	if (!host) {
		return;
	}

	host = normalizeDeepLinkingServerHost(host);
	if (!host) {
		return;
	}
	params.host = host;

	const server = UserPreferences.getString(CURRENT_SERVER);
	const user = UserPreferences.getString(`${TOKEN_KEY}-${host}`);

	const serverRecord = yield* call(getServerById, host);

	if (server === host && user && serverRecord) {
		const connected = yield* appSelector(state => state.server.connected);
		if (!connected) {
			yield* call(localAuthenticate, host);
			yield* put(selectServerRequest(host, serverRecord.version, true));
			yield* take(types.LOGIN.SUCCESS);
		}
		yield* call(handleNavigateCallRoom, { params });
	} else {
		if (user && serverRecord) {
			yield* call(localAuthenticate, host);
			yield* put(selectServerRequest(host, serverRecord.version, true, true));
			yield* take(types.LOGIN.SUCCESS);
			yield* call(handleNavigateCallRoom, { params });
			return;
		}
		// if deep link is from a different server
		const result = yield* call(getServerInfo, host);
		if (!result.success) {
			// Fallback to prevent the app from being stuck on splash screen
			yield* call(fallbackNavigation);
			return;
		}
		yield* put(appStart({ root: RootEnum.ROOT_OUTSIDE }));
		if (server) {
			yield* put(serverInitAdd(server));
		}
		yield* delay(1000);
		EventEmitter.emit('NewServer', { server: host });
		if (params.token) {
			yield* take(types.SERVER.SELECT_SUCCESS);
			// SERVER.SELECT_SUCCESS doesn't mean 'connected'; skip the take if it already is.
			const connected = yield* appSelector(state => state.meteor.connected);
			if (!connected) {
				yield* take(types.METEOR.SUCCESS);
			}
			yield* put(loginRequest({ resume: params.token }, true));
			yield* take(types.LOGIN.SUCCESS);
			yield* call(handleNavigateCallRoom, { params });
		}
	}
};

const root = function* root() {
	yield* takeLatest(types.DEEP_LINKING.OPEN, handleOpen);
	yield* takeLatest(types.DEEP_LINKING.OPEN_VIDEO_CONF, handleClickCallPush);
};
export default root;
