import { AsyncStorage } from 'react-native';
import { delay } from 'redux-saga';
import {
	takeLatest, take, select, put, all, race
} from 'redux-saga/effects';

import Navigation from '../lib/Navigation';
import * as types from '../actions/actionsTypes';
import { appStart, setStackRoot } from '../actions';
import { selectServerRequest } from '../actions/server';
import database from '../lib/realm';
import RocketChat from '../lib/rocketchat';
import EventEmitter from '../utils/events';

const roomTypes = {
	channel: 'c', direct: 'd', group: 'p'
};

const navigate = function* navigate({ params, sameServer = true }) {
	if (!sameServer) {
		yield put(appStart('inside'));
	}
	if (params.rid) {
		const canOpenRoom = yield RocketChat.canOpenRoom(params);
		if (canOpenRoom) {
			const stack = 'RoomsListView';
			const stackRoot = yield select(state => state.app.stackRoot);

			// Make sure current stack is RoomsListView before navigate to RoomView
			if (stackRoot !== stack) {
				yield Navigation.setStackRoot('AppRoot', {
					component: {
						id: stack,
						name: stack
					}
				});
				yield put(setStackRoot(stack));
			}
			try {
				yield Navigation.popToRoot(stack);
			} catch (error) {
				console.log(error);
			}
			const [type, name] = params.path.split('/');
			Navigation.push(stack, {
				component: {
					name: 'RoomView',
					passProps: {
						rid: params.rid, name, t: roomTypes[type]
					}
				}
			});
		}
	}
};

const handleOpen = function* handleOpen({ params }) {
	const isReady = yield select(state => state.app.ready);

	if (!isReady) {
		yield take(types.APP.READY);
	}

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
			yield race({
				typing: take(types.SERVER.SELECT_SUCCESS),
				timeout: delay(3000)
			});
			yield navigate({ params });
		}
	} else {
		// if deep link is from a different server
		const result = yield RocketChat.testServer(server);
		if (!result.success) {
			return;
		}

		// search if deep link's server already exists
		const servers = yield database.databases.serversDB.objects('servers').filtered('id = $0', host); // TODO: need better test
		if (servers.length && user) {
			yield put(selectServerRequest(host));
			yield navigate({ params, sameServer: false });
		} else {
			yield put(appStart('outside'));
			yield delay(1000);
			EventEmitter.emit('NewServer', { server: host });
		}
	}
};

const root = function* root() {
	yield takeLatest(types.DEEP_LINKING.OPEN, handleOpen);
};
export default root;
