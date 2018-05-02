import { AsyncStorage } from 'react-native';
import { delay } from 'redux-saga';
import { takeLatest, take, select, call, put } from 'redux-saga/effects';
import * as types from '../actions/actionsTypes';
import { setServer, addServer } from '../actions/server';
import * as NavigationService from '../containers/routes/NavigationService';
import database from '../lib/realm';
import RocketChat from '../lib/rocketchat';

const navigate = function* go({ server, params, sameServer = true }) {
	const user = yield AsyncStorage.getItem(`${ RocketChat.TOKEN_KEY }-${ server }`);
	if (user) {
		const { rid, path } = params;
		if (rid) {
			const canOpenRoom = yield RocketChat.canOpenRoom({ rid, path });
			if (canOpenRoom) {
				return yield call(NavigationService.goRoom, { rid: params.rid });
			}
		}
		if (!sameServer) {
			yield call(NavigationService.goRoomsList);
		}
	}
};

const handleOpen = function* handleOpen({ params }) {
	const isReady = yield select(state => state.app.ready);
	const server = yield select(state => state.server.server);

	if (!isReady) {
		yield take(types.APP.READY);
	}

	const host = `https://${ params.host }`;

	// TODO: needs better test
	// if deep link is from same server
	if (server === host) {
		yield navigate({ server, params });
	} else { // if deep link is from a different server
		// search if deep link's server already exists
		const servers = yield database.databases.serversDB.objects('servers').filtered('id = $0', host); // TODO: need better test
		if (servers.length) {
			// if server exists, select it
			yield put(setServer(servers[0].id));
			yield delay(2000);
			yield navigate({ server: servers[0].id, params, sameServer: false });
		} else {
			yield put(addServer(host));
		}
	}
};

const root = function* root() {
	yield takeLatest(types.DEEP_LINKING.OPEN, handleOpen);
};
export default root;
