import { all, call, delay, put, select, take, takeLatest } from 'redux-saga/effects';

import { shareSetParams } from '../actions/share';
import * as types from '../actions/actionsTypes';
import { appInit, appStart } from '../actions/app';
import { inviteLinksRequest, inviteLinksSetToken } from '../actions/inviteLinks';
import { loginRequest } from '../actions/login';
import { selectServerRequest, serverInitAdd } from '../actions/server';
import { RootEnum } from '../definitions';
import { CURRENT_SERVER, TOKEN_KEY } from '../lib/constants';
import database from '../lib/database';
import { getServerById } from '../lib/database/services/Server';
import { canOpenRoom, getServerInfo } from '../lib/methods';
import { getUidDirectMessage } from '../lib/methods/helpers';
import EventEmitter from '../lib/methods/helpers/events';
import { goRoom, navigateToRoom } from '../lib/methods/helpers/goRoom';
import { localAuthenticate } from '../lib/methods/helpers/localAuthentication';
import log from '../lib/methods/helpers/log';
import UserPreferences from '../lib/methods/userPreferences';
import { videoConfJoin } from '../lib/methods/videoConf';
import { Services } from '../lib/services';
import sdk from '../lib/services/sdk';

const roomTypes = {
	channel: 'c',
	direct: 'd',
	group: 'p',
	channels: 'l'
};

const handleInviteLink = function* handleInviteLink({ params, requireLogin = false }) {
	if (params.path && params.path.startsWith('invite/')) {
		const token = params.path.replace('invite/', '');
		if (requireLogin) {
			yield put(inviteLinksSetToken(token));
		} else {
			yield put(inviteLinksRequest(token));
		}
	}
};

const navigate = function* navigate({ params }) {
	yield put(appStart({ root: RootEnum.ROOT_INSIDE }));
	if (params.path || params.rid) {
		let type;
		let name;
		let jumpToThreadId;
		if (params.path) {
			// Following this pattern: {channelType}/{channelName}/thread/{threadId}
			[type, name, , jumpToThreadId] = params.path.split('/');
		}
		if (type !== 'invite' || params.rid) {
			const room = yield canOpenRoom(params);
			if (room) {
				const item = {
					name,
					t: roomTypes[type],
					roomUserId: getUidDirectMessage(room),
					...room
				};

				const isMasterDetail = yield select(state => state.app.isMasterDetail);
				const jumpToMessageId = params.messageId;

				yield goRoom({ item, isMasterDetail, jumpToMessageId, jumpToThreadId, popToRoot: true });
			}
		} else {
			yield handleInviteLink({ params });
		}
	}
};

const fallbackNavigation = function* fallbackNavigation() {
	const currentRoot = yield select(state => state.app.root);
	if (currentRoot) {
		return;
	}
	yield put(appInit());
};

const handleOAuth = function* handleOAuth({ params }) {
	const { credentialToken, credentialSecret } = params;
	try {
		yield Services.loginOAuthOrSso({ oauth: { credentialToken, credentialSecret } }, false);
	} catch (e) {
		log(e);
	}
};

const handleShareExtension = function* handleOpen({ params }) {
	const server = UserPreferences.getString(CURRENT_SERVER);
	const user = UserPreferences.getString(`${TOKEN_KEY}-${server}`);

	if (!user) {
		yield put(appInit());
		return;
	}

	yield put(appStart({ root: RootEnum.ROOT_LOADING_SHARE_EXTENSION }));
	yield localAuthenticate(server);
	const serverRecord = yield getServerById(server);
	if (!serverRecord) {
		return;
	}
	yield put(selectServerRequest(server, serverRecord.version));
	if (sdk.current?.client?.host !== server) {
		yield take(types.LOGIN.SUCCESS);
	}
	yield put(shareSetParams(params));
	yield put(appStart({ root: RootEnum.ROOT_SHARE_EXTENSION }));
};

const handleOpen = function* handleOpen({ params }) {
	if (params.type === 'shareextension') {
		yield handleShareExtension({ params });
		return;
	}
	if (params.type === 'oauth') {
		yield handleOAuth({ params });
		return;
	}

	// If there's no host on the deep link params and the app is opened, just call appInit()
	let { host } = params;
	if (!host) {
		yield fallbackNavigation();
		return;
	}

	// If there's host, continue
	if (!/^(http|https)/.test(host)) {
		if (/^localhost(:\d+)?/.test(host)) {
			host = `http://${host}`;
		} else {
			host = `https://${host}`;
		}
	} else {
		// Notification should always come from https
		host = host.replace('http://', 'https://');
	}
	// remove last "/" from host
	if (host.slice(-1) === '/') {
		host = host.slice(0, host.length - 1);
	}

	const [server, user] = yield all([
		UserPreferences.getString(CURRENT_SERVER),
		UserPreferences.getString(`${TOKEN_KEY}-${host}`)
	]);

	const serverRecord = yield getServerById(host);

	// TODO: needs better test
	// if deep link is from same server
	if (server === host && user && serverRecord) {
		const connected = yield select(state => state.server.connected);
		if (!connected) {
			yield localAuthenticate(host);
			yield put(selectServerRequest(host, serverRecord.version, true));
			yield take(types.LOGIN.SUCCESS);
		}
		yield navigate({ params });
	} else {
		// search if deep link's server already exists
		try {
			if (user && serverRecord) {
				yield localAuthenticate(host);
				yield put(selectServerRequest(host, serverRecord.version, true, true));
				yield take(types.LOGIN.SUCCESS);
				yield navigate({ params });
				return;
			}
		} catch (e) {
			// do nothing?
		}
		// if deep link is from a different server
		const result = yield getServerInfo(host);
		if (!result.success) {
			// Fallback to prevent the app from being stuck on splash screen
			yield fallbackNavigation();
			return;
		}
		yield put(appStart({ root: RootEnum.ROOT_OUTSIDE }));
		yield put(serverInitAdd(server));
		yield delay(1000);
		EventEmitter.emit('NewServer', { server: host });

		if (params.token) {
			yield take(types.SERVER.SELECT_SUCCESS);
			yield put(loginRequest({ resume: params.token }, true));
			yield take(types.LOGIN.SUCCESS);
			yield navigate({ params });
		} else {
			yield handleInviteLink({ params, requireLogin: true });
		}
	}
};

const handleNavigateCallRoom = function* handleNavigateCallRoom({ params }) {
	try {
		yield put(appStart({ root: RootEnum.ROOT_INSIDE }));
		const db = database.active;
		const subsCollection = db.get('subscriptions');
		const room = yield subsCollection.find(params.rid);
		if (room) {
			const isMasterDetail = yield select(state => state.app.isMasterDetail);
			yield navigateToRoom({ item: room, isMasterDetail, popToRoot: true });
			const uid = params.caller._id;
			const { rid, callId, event } = params;
			if (event === 'accept') {
				yield call(Services.notifyUser, `${uid}/video-conference`, {
					action: 'accepted',
					params: { uid, rid, callId }
				});
				yield videoConfJoin(callId, true, false, true);
			} else if (event === 'decline') {
				yield call(Services.notifyUser, `${uid}/video-conference`, {
					action: 'rejected',
					params: { uid, rid, callId }
				});
			}
		}
	} catch (e) {
		log(e);
	}
};

const handleClickCallPush = function* handleClickCallPush({ params }) {
	let { host } = params;

	if (host.slice(-1) === '/') {
		host = host.slice(0, host.length - 1);
	}

	const [server, user] = yield all([
		UserPreferences.getString(CURRENT_SERVER),
		UserPreferences.getString(`${TOKEN_KEY}-${host}`)
	]);

	const serverRecord = yield getServerById(host);

	if (server === host && user && serverRecord) {
		const connected = yield select(state => state.server.connected);
		if (!connected) {
			yield localAuthenticate(host);
			yield put(selectServerRequest(host, serverRecord.version, true));
			yield take(types.LOGIN.SUCCESS);
		}
		yield handleNavigateCallRoom({ params });
	} else {
		if (user && serverRecord) {
			yield localAuthenticate(host);
			yield put(selectServerRequest(host, serverRecord.version, true, true));
			yield take(types.LOGIN.SUCCESS);
			yield handleNavigateCallRoom({ params });
			return;
		}
		// if deep link is from a different server
		const result = yield Services.getServerInfo(host);
		if (!result.success) {
			// Fallback to prevent the app from being stuck on splash screen
			yield fallbackNavigation();
			return;
		}
		yield put(appStart({ root: RootEnum.ROOT_OUTSIDE }));
		yield put(serverInitAdd(server));
		yield delay(1000);
		EventEmitter.emit('NewServer', { server: host });
		if (params.token) {
			yield take(types.SERVER.SELECT_SUCCESS);
			yield put(loginRequest({ resume: params.token }, true));
			yield take(types.LOGIN.SUCCESS);
			yield handleNavigateCallRoom({ params });
		}
	}
};

const root = function* root() {
	yield takeLatest(types.DEEP_LINKING.OPEN, handleOpen);
	yield takeLatest(types.DEEP_LINKING.OPEN_VIDEO_CONF, handleClickCallPush);
};
export default root;
