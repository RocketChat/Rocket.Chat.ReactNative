import {
	takeLatest, take, select, put, all, delay
} from 'redux-saga/effects';

import UserPreferences from '../lib/userPreferences';
import Navigation from '../lib/Navigation';
import * as types from '../actions/actionsTypes';
import { selectServerRequest, serverInitAdd } from '../actions/server';
import { inviteLinksSetToken, inviteLinksRequest } from '../actions/inviteLinks';
import database from '../lib/database';
import RocketChat from '../lib/rocketchat';
import EventEmitter from '../utils/events';
import {
	appStart, ROOT_INSIDE, ROOT_NEW_SERVER, appInit
} from '../actions/app';
import { localAuthenticate } from '../utils/localAuthentication';
import { goRoom } from '../utils/goRoom';
import { loginRequest } from '../actions/login';

const roomTypes = {
	channel: 'c', direct: 'd', group: 'p', channels: 'l'
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

const popToRoot = function popToRoot({ isMasterDetail }) {
	if (isMasterDetail) {
		Navigation.navigate('DrawerNavigator');
	} else {
		Navigation.navigate('RoomsListView');
	}
};

const navigate = function* navigate({ params }) {
	yield put(appStart({ root: ROOT_INSIDE }));
	if (params.path || params.rid) {
		let type;
		let name;
		if (params.path) {
			[type, name] = params.path.split('/');
		}
		if (type !== 'invite' || params.rid) {
			const room = yield RocketChat.canOpenRoom(params);
			if (room) {
				const item = {
					name,
					t: roomTypes[type],
					roomUserId: RocketChat.getUidDirectMessage(room),
					...room
				};

				const isMasterDetail = yield select(state => state.app.isMasterDetail);
				const focusedRooms = yield select(state => state.room.rooms);
				const jumpToMessageId = params.messageId;

				if (focusedRooms.includes(room.rid)) {
					// if there's one room on the list or last room is the one
					if (focusedRooms.length === 1 || focusedRooms[0] === room.rid) {
						yield goRoom({ item, isMasterDetail, jumpToMessageId });
					} else {
						popToRoot({ isMasterDetail });
						yield goRoom({ item, isMasterDetail, jumpToMessageId });
					}
				} else {
					popToRoot({ isMasterDetail });
					yield goRoom({ item, isMasterDetail, jumpToMessageId });
				}

				if (params.isCall) {
					RocketChat.callJitsi(item);
				}
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

const handleOpen = function* handleOpen({ params }) {
	const serversDB = database.servers;
	const serversCollection = serversDB.get('servers');

	let { host } = params;
	if (params.isCall && !host) {
		const servers = yield serversCollection.query().fetch();
		// search from which server is that call
		servers.forEach(({ uniqueID, id }) => {
			if (params.path.includes(uniqueID)) {
				host = id;
			}
		});
	}

	// If there's no host on the deep link params and the app is opened, just call appInit()
	if (!host) {
		yield fallbackNavigation();
		return;
	}

	// If there's host, continue
	if (!/^(http|https)/.test(host)) {
		if (/^localhost(:\d+)?/.test(host)) {
			host = `http://${ host }`;
		} else {
			host = `https://${ host }`;
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
		UserPreferences.getStringAsync(RocketChat.CURRENT_SERVER),
		UserPreferences.getStringAsync(`${ RocketChat.TOKEN_KEY }-${ host }`)
	]);

	// TODO: needs better test
	// if deep link is from same server
	if (server === host && user) {
		const connected = yield select(state => state.server.connected);
		if (!connected) {
			yield localAuthenticate(host);
			yield put(selectServerRequest(host));
			yield take(types.LOGIN.SUCCESS);
		}
		yield navigate({ params });
	} else {
		// search if deep link's server already exists
		try {
			const hostServerRecord = yield serversCollection.find(host);
			if (hostServerRecord && user) {
				yield localAuthenticate(host);
				yield put(selectServerRequest(host, hostServerRecord.version, true, true));
				yield take(types.LOGIN.SUCCESS);
				yield navigate({ params });
				return;
			}
		} catch (e) {
			// do nothing?
		}
		// if deep link is from a different server
		const result = yield RocketChat.getServerInfo(host);
		if (!result.success) {
			// Fallback to prevent the app from being stuck on splash screen
			yield fallbackNavigation();
			return;
		}
		yield put(appStart({ root: ROOT_NEW_SERVER }));
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

const root = function* root() {
	yield takeLatest(types.DEEP_LINKING.OPEN, handleOpen);
};
export default root;
