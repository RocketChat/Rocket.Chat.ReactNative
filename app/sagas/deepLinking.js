import { AsyncStorage } from 'react-native';
import { delay } from 'redux-saga';
import {
	takeLatest, take, select, put
} from 'redux-saga/effects';
import { Navigation } from 'react-native-navigation';

import * as types from '../actions/actionsTypes';
import { appStart, setStackRoot } from '../actions';
import { selectServerRequest } from '../actions/server';
import database from '../lib/realm';
import RocketChat from '../lib/rocketchat';
import EventEmitter from '../utils/events';

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
			Navigation.push(stack, {
				component: {
					name: 'RoomView',
					passProps: {
						rid: params.rid
					}
				}
			});
		}
	}
};

const handleOpen = function* handleOpen({ params }) {
	const isReady = yield select(state => state.app.ready);
	const server = yield select(state => state.server.server);

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

	try {
		yield RocketChat.testServer(host);
	} catch (error) {
		return;
	}

	const token = yield AsyncStorage.getItem(`${ RocketChat.TOKEN_KEY }-${ host }`);

	// TODO: needs better test
	// if deep link is from same server
	if (server === host) {
		if (token) {
			yield navigate({ params });
		}
	} else { // if deep link is from a different server
		// search if deep link's server already exists
		const servers = yield database.databases.serversDB.objects('servers').filtered('id = $0', host); // TODO: need better test
		if (servers.length && token) {
			yield put(selectServerRequest(host));
			yield take(types.METEOR.REQUEST);
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
