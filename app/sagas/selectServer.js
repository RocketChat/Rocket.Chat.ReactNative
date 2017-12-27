import { put, call, takeLatest, race, take } from 'redux-saga/effects';
import { delay } from 'redux-saga';
import { AsyncStorage } from 'react-native';
import { SERVER } from '../actions/actionsTypes';
import * as actions from '../actions';
import { connectRequest, disconnect, disconnect_by_user } from '../actions/connect';
import { changedServer, serverSuccess, serverFailure, serverRequest, setServer } from '../actions/server';
import RocketChat from '../lib/rocketchat';
import database from '../lib/realm';
import * as NavigationService from '../containers/routes/NavigationService';

const validate = function* validate(server) {
	return yield RocketChat.testServer(server);
};

const selectServer = function* selectServer({ server }) {
	yield database.setActiveDB(server);
	yield put(disconnect_by_user());
	yield put(disconnect());
	yield put(changedServer(server));
	yield call([AsyncStorage, 'setItem'], 'currentServer', server);
	const settings = database.objects('settings');
	yield put(actions.setAllSettings(RocketChat.parseSettings(settings.slice(0, settings.length))));
	const permissions = database.objects('permissions');
	yield put(actions.setAllPermissions(RocketChat.parsePermissions(permissions.slice(0, permissions.length))));
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
		database.databases.serversDB.write(() => {
			database.databases.serversDB.create('servers', { id: server, current: false }, true);
		});
		yield put(setServer(server));
	}
};

const handleGotoAddServer = function* handleGotoAddServer() {
	yield call(AsyncStorage.removeItem, RocketChat.TOKEN_KEY);
	yield call(NavigationService.navigate, 'AddServer');
};

const root = function* root() {
	yield takeLatest(SERVER.REQUEST, validateServer);
	yield takeLatest(SERVER.SELECT, selectServer);
	yield takeLatest(SERVER.ADD, addServer);
	yield takeLatest(SERVER.GOTO_ADD, handleGotoAddServer);
};
export default root;
