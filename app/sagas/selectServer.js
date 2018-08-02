import { put, call, takeLatest } from 'redux-saga/effects';
import { delay } from 'redux-saga';
import { AsyncStorage } from 'react-native';

import { NavigationActions } from '../Navigation';
import { SERVER } from '../actions/actionsTypes';
import * as actions from '../actions';
import { connectRequest } from '../actions/connect';
import { serverSuccess, serverFailure, selectServerRequest, selectServerSuccess } from '../actions/server';
import { setRoles } from '../actions/roles';
import RocketChat from '../lib/rocketchat';
import database from '../lib/realm';
import log from '../utils/log';
import I18n from '../i18n';

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
		} else {
			yield put(actions.appStart('outside'));
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
	try {
		yield put(actions.appStart('outside'));
		yield call(NavigationActions.resetTo, { screen: 'ListServerView', title: I18n.t('Servers') });
		database.databases.serversDB.write(() => {
			database.databases.serversDB.create('servers', { id: server, current: false }, true);
		});
		yield put(selectServerRequest(server));
	} catch (e) {
		log('addServer', e);
	}
};

const root = function* root() {
	yield takeLatest(SERVER.REQUEST, validateServer);
	yield takeLatest(SERVER.SELECT_REQUEST, handleSelectServer);
	yield takeLatest(SERVER.ADD, addServer);
};
export default root;
