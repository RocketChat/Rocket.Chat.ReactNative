import { put, takeEvery, call, takeLatest, race, take } from 'redux-saga/effects';
import { delay } from 'redux-saga';
import { AsyncStorage } from 'react-native';
// import { Navigation } from 'react-native-navigation';
import { SERVER } from '../actions/actionsTypes';
import { connectRequest, disconnect } from '../actions/connect';
import { changedServer, serverSuccess, serverFailure, serverRequest } from '../actions/server';
import RocketChat from '../lib/rocketchat';
import realm from '../lib/realm';

const validate = function* validate(server) {
	return yield RocketChat.testServer(server);
};

const selectServer = function* selectServer({ server }) {
	yield put(disconnect());
	yield put(changedServer(server));
	yield call([AsyncStorage, 'setItem'], 'currentServer', server);
	yield put(connectRequest(server));
};


const validateServer = function* validateServer({ server }) {
	try {
		yield delay(1000);
		yield call(validate, server);
		yield put(serverSuccess());
	} catch (e) {
		console.log(e);
		yield put(serverFailure(e));
	}
};

const addServer = function* addServer({ server }) {
	yield call(serverRequest, server);

	const { error } = yield race({
		error: take(SERVER.FAILURE),
		success: take(SERVER.SUCCESS)
	});
	if (!error) {
		realm.write(() => {
			realm.create('servers', { id: server, current: false }, true);
		});
	}
};


const root = function* root() {
	yield takeLatest(SERVER.REQUEST, validateServer);
	yield takeEvery(SERVER.SELECT, selectServer);
	yield takeEvery(SERVER.ADD, addServer);
};
export default root;
