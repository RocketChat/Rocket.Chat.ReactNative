import { AsyncStorage } from 'react-native';
import { takeLatest, take, select, put } from 'redux-saga/effects';

import * as types from '../actions/actionsTypes';
import { appStart } from '../actions';
import { selectServerRequest, addServer } from '../actions/server';
import database from '../lib/realm';
import RocketChat from '../lib/rocketchat';
import { NavigationActions } from '../Navigation';

const navigate = function* go({ params, sameServer = true }) {
	if (!sameServer) {
		yield put(appStart('inside'));
	}
	if (params.rid) {
		const canOpenRoom = yield RocketChat.canOpenRoom(params);
		if (canOpenRoom) {
			return NavigationActions.push({
				screen: 'RoomView',
				passProps: {
					rid: params.rid
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
		if (servers.length) {
			const deepLinkServer = servers[0].id;
			if (!token) {
				yield put(appStart('outside'));
			} else {
				yield put(selectServerRequest(deepLinkServer));
				yield take(types.METEOR.REQUEST);
				yield navigate({ params, sameServer: false });
			}
		} else {
			yield put(addServer(host));
		}
	}
};

const root = function* root() {
	yield takeLatest(types.DEEP_LINKING.OPEN, handleOpen);
};
export default root;
