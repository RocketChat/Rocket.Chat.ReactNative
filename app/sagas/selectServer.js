import { put, call, takeLatest, take } from 'redux-saga/effects';
import { delay } from 'redux-saga';
import { AsyncStorage } from 'react-native';
import { SERVER, LOGIN } from '../actions/actionsTypes';
import * as actions from '../actions';
import { connectRequest } from '../actions/connect';
import { serverSuccess, serverFailure, setServer } from '../actions/server';
import { setRoles } from '../actions/roles';
import RocketChat from '../lib/rocketchat';
import database from '../lib/realm';
import { navigate } from '../containers/routes/NavigationService';

const validate = function* validate(server) {
	return yield RocketChat.testServer(server);
};

const selectServer = function* selectServer({ server }) {
	try {
		yield database.setActiveDB(server);

		// yield RocketChat.disconnect();

		yield call([AsyncStorage, 'setItem'], 'currentServer', server);
		// yield AsyncStorage.removeItem(RocketChat.TOKEN_KEY);
		const settings = database.objects('settings');
		yield put(actions.setAllSettings(RocketChat.parseSettings(settings.slice(0, settings.length))));
		const permissions = database.objects('permissions');
		yield put(actions.setAllPermissions(RocketChat.parsePermissions(permissions.slice(0, permissions.length))));
		const emojis = database.objects('customEmojis');
		yield put(actions.setCustomEmojis(RocketChat.parseEmojis(emojis.slice(0, emojis.length))));
		const roles = database.objects('roles');
		yield put(setRoles(roles.reduce((result, role) => {
			result[role._id] = role.description;
			return result;
		}, {})));

		yield put(connectRequest());
	} catch (e) {
		console.warn('selectServer', e);
	}
};

const validateServer = function* validateServer({ server }) {
	try {
		yield delay(1000);
		yield call(validate, server);
		yield put(serverSuccess());
	} catch (e) {
		console.warn('validateServer', e);
		yield put(serverFailure(e));
	}
};

const addServer = function* addServer({ server }) {
	database.databases.serversDB.write(() => {
		database.databases.serversDB.create('servers', { id: server, current: false }, true);
	});
	yield put(setServer(server));
	yield take(LOGIN.SET_TOKEN);
	navigate('LoginSignup');
};

const handleGotoAddServer = function* handleGotoAddServer() {
	yield call(AsyncStorage.removeItem, RocketChat.TOKEN_KEY);
	yield call(navigate, 'AddServer');
};

const root = function* root() {
	yield takeLatest(SERVER.REQUEST, validateServer);
	yield takeLatest(SERVER.SELECT, selectServer);
	yield takeLatest(SERVER.ADD, addServer);
	yield takeLatest(SERVER.GOTO_ADD, handleGotoAddServer);
};
export default root;
