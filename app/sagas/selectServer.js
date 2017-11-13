import { put, takeEvery, call, takeLatest, race, take } from 'redux-saga/effects';
import { delay } from 'redux-saga';
import { AsyncStorage } from 'react-native';
import { SERVER } from '../actions/actionsTypes';
import { connectRequest, disconnect } from '../actions/connect';
import { changedServer, serverSuccess, serverFailure, serverRequest, setServer } from '../actions/server';
import { logout } from '../actions/login';
import RocketChat from '../lib/rocketchat';
import realm from '../lib/realm';
import * as NavigationService from '../containers/routes/NavigationService';

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
	yield put(serverRequest(server));

	const { error } = yield race({
		error: take(SERVER.FAILURE),
		success: take(SERVER.SUCCESS)
	});
	if (!error) {
		realm.write(() => {
			realm.create('servers', { id: server, current: false }, true);
		});
		yield put(setServer(server));
	}
};

const handleGotoAddServer = function* handleGotoAddServer() {
	yield put(logout());
	yield call(AsyncStorage.removeItem, RocketChat.TOKEN_KEY);
	yield delay(1000);
	yield call(NavigationService.navigate, 'AddServer');
};

const root = function* root() {
	yield takeLatest(SERVER.REQUEST, validateServer);
	yield takeEvery(SERVER.SELECT, selectServer);
	yield takeEvery(SERVER.ADD, addServer);
	yield takeEvery(SERVER.GOTO_ADD, handleGotoAddServer);
};
export default root;
