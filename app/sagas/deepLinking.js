import {
	takeLatest, take, select, put, all, delay
} from 'redux-saga/effects';
import RNUserDefaults from 'rn-user-defaults';

import Navigation from '../lib/Navigation';
import * as types from '../actions/actionsTypes';
import { selectServerRequest } from '../actions/server';
import { inviteLinksSetToken, inviteLinksRequest } from '../actions/inviteLinks';
import database from '../lib/database';
import RocketChat from '../lib/rocketchat';
import EventEmitter from '../utils/events';
import { appStart } from '../actions';

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

const navigate = function* navigate({ params }) {
	yield put(appStart('inside'));
	if (params.path) {
		const [type, name] = params.path.split('/');
		if (type !== 'invite') {
			const room = yield RocketChat.canOpenRoom(params);
			if (room) {
				yield Navigation.navigate('RoomsListView');
				Navigation.navigate('RoomView', {
					name,
					t: roomTypes[type],
					roomUserId: RocketChat.getUidDirectMessage(room),
					...room
				});
			}
		} else {
			yield handleInviteLink({ params });
		}
	}
};

const handleOpen = function* handleOpen({ params }) {
	if (!params.host) {
		return;
	}

	let { host } = params;
	if (!/^(http|https)/.test(host)) {
		host = `https://${ params.host }`;
	}
	// remove last "/" from host
	if (host.slice(-1) === '/') {
		host = host.slice(0, host.length - 1);
	}

	const [server, user] = yield all([
		RNUserDefaults.get('currentServer'),
		RNUserDefaults.get(`${ RocketChat.TOKEN_KEY }-${ host }`)
	]);

	// TODO: needs better test
	// if deep link is from same server
	if (server === host && user) {
		const connected = yield select(state => state.server.connected);
		if (!connected) {
			yield put(selectServerRequest(host));
			yield take(types.SERVER.SELECT_SUCCESS);
		}
		yield navigate({ params });
	} else {
		// search if deep link's server already exists
		const serversDB = database.servers;
		const serversCollection = serversDB.collections.get('servers');
		try {
			const servers = yield serversCollection.find(host);
			if (servers && user) {
				yield put(selectServerRequest(host));
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
			return;
		}
		Navigation.navigate('NewServerView', { previousServer: server });
		yield delay(1000);
		EventEmitter.emit('NewServer', { server: host });

		if (params.token) {
			yield take(types.SERVER.SELECT_SUCCESS);
			yield RocketChat.connect({ server: host, user: { token: params.token } });
		} else {
			yield handleInviteLink({ params, requireLogin: true });
		}
	}
};

const root = function* root() {
	yield takeLatest(types.DEEP_LINKING.OPEN, handleOpen);
};
export default root;
