import { put, call, takeLatest } from 'redux-saga/effects';
import { AsyncStorage } from 'react-native';

import { NavigationActions } from '../Navigation';
import { SERVER } from '../actions/actionsTypes';
import * as actions from '../actions';
import { connectRequest } from '../actions/connect';
import { serverFailure, selectServerRequest, selectServerSuccess } from '../actions/server';
import { setRoles } from '../actions/roles';
import RocketChat from '../lib/rocketchat';
import database from '../lib/realm';
import log from '../utils/log';

const validate = function* validate(server) {
	return yield RocketChat.testServer(server);
};

const handleSelectServer = function* handleSelectServer({ server }) {
	try {
		yield database.setActiveDB(server);
		yield call([AsyncStorage, 'setItem'], 'currentServer', server);
		const token = yield AsyncStorage.getItem(`${ RocketChat.TOKEN_KEY }-${ server }`);
		if (token) {
			yield put(actions.appStart('inside'));
		}

		const settings = database.objects('settings');
		yield put(actions.setAllSettings(RocketChat.parseSettings(settings.slice(0, settings.length))));
		const emojis = database.objects('customEmojis');
		yield put(actions.setCustomEmojis(RocketChat.parseEmojis(emojis.slice(0, emojis.length))));
		const roles = database.objects('roles');
		yield put(setRoles(roles.reduce((result, role) => {
			result[role._id] = role.description;
			return result;
		}, {})));

		yield put(connectRequest());
		yield put(selectServerSuccess(server));
	} catch (e) {
		log('handleSelectServer', e);
	}
};

const handleServerRequest = function* handleServerRequest({ server }) {
	try {
		yield call(validate, server);
		yield call(NavigationActions.push, { screen: 'LoginSignupView', title: server, backButtonTitle: '' });
		database.databases.serversDB.write(() => {
			database.databases.serversDB.create('servers', { id: server }, true);
		});
		yield put(selectServerRequest(server));
	} catch (e) {
		yield put(serverFailure());
		log('handleServerRequest', e);
	}
};

const root = function* root() {
	yield takeLatest(SERVER.SELECT_REQUEST, handleSelectServer);
	yield takeLatest(SERVER.REQUEST, handleServerRequest);
};
export default root;
