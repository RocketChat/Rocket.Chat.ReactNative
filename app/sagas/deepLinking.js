import { AsyncStorage } from 'react-native';
import { delay } from 'redux-saga';
import {
	takeLatest, take, select, put, all
} from 'redux-saga/effects';

import Navigation from '../lib/Navigation';
import * as types from '../actions/actionsTypes';
import { selectServerRequest } from '../actions/server';
import database from '../lib/realm';
import RocketChat from '../lib/rocketchat';
import EventEmitter from '../utils/events';
import { appStart } from '../actions';

const roomTypes = {
	channel: 'c', direct: 'd', group: 'p'
};

const navigate = function* navigate({ params }) {
	yield put(appStart('inside'));
	if (params.rid) {
		const canOpenRoom = yield RocketChat.canOpenRoom(params);
		if (canOpenRoom) {
			const [type, name] = params.path.split('/');
			yield Navigation.navigate('RoomsListView');
			Navigation.navigate('RoomView', { rid: params.rid, name, t: roomTypes[type] });
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
		AsyncStorage.getItem('currentServer'),
		AsyncStorage.getItem(`${ RocketChat.TOKEN_KEY }-${ host }`)
	]);

	// TODO: needs better test
	// if deep link is from same server
	if (server === host) {
		if (user) {
			const connected = yield select(state => state.server.connected);
			if (!connected) {
				yield put(selectServerRequest(host));
				yield take(types.SERVER.SELECT_SUCCESS);
			}
			yield navigate({ params });
		} else {
			yield put(appStart('outside'));
		}
	} else {
		// search if deep link's server already exists
		const servers = yield database.databases.serversDB.objects('servers').filtered('id = $0', host); // TODO: need better test
		if (servers.length && user) {
			yield put(selectServerRequest(host));
			yield take(types.SERVER.SELECT_SUCCESS);
			yield navigate({ params });
		} else {
			// if deep link is from a different server
			const result = yield RocketChat.getServerInfo(server);
			if (!result.success) {
				return;
			}
			Navigation.navigate('OnboardingView', { previousServer: server });
			yield delay(1000);
			EventEmitter.emit('NewServer', { server: host });
		}
	}
};

const root = function* root() {
	yield takeLatest(types.DEEP_LINKING.OPEN, handleOpen);
};
export default root;
