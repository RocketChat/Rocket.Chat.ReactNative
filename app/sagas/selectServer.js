import { put, takeLatest } from 'redux-saga/effects';
import { AsyncStorage, Alert } from 'react-native';

import Navigation from '../lib/Navigation';
import { SERVER } from '../actions/actionsTypes';
import * as actions from '../actions';
import { serverFailure, selectServerRequest, selectServerSuccess } from '../actions/server';
import { setUser } from '../actions/login';
import RocketChat from '../lib/rocketchat';
import database from '../lib/realm';
import log from '../utils/log';
import I18n from '../i18n';

const getServerInfo = function* getServerInfo({ server, raiseError = true }) {
	try {
		const serverInfo = yield RocketChat.getServerInfo(server);
		if (!serverInfo.success) {
			if (raiseError) {
				Alert.alert(I18n.t('Oops'), I18n.t(serverInfo.message, serverInfo.messageOptions));
			}
			yield put(serverFailure());
			return;
		}

		database.databases.serversDB.write(() => {
			database.databases.serversDB.create('servers', { id: server, version: serverInfo.version }, true);
		});

		return serverInfo;
	} catch (e) {
		log('err_get_server_info', e);
	}
};

const handleSelectServer = function* handleSelectServer({ server, version, fetchVersion }) {
	try {
		yield AsyncStorage.setItem('currentServer', server);
		const userStringified = yield AsyncStorage.getItem(`${ RocketChat.TOKEN_KEY }-${ server }`);

		if (userStringified) {
			const user = JSON.parse(userStringified);
			RocketChat.connect({ server, user });
			yield put(setUser(user));
			yield put(actions.appStart('inside'));
		} else {
			RocketChat.connect({ server });
			yield put(actions.appStart('outside'));
		}

		const settings = database.objects('settings');
		yield put(actions.setAllSettings(RocketChat.parseSettings(settings.slice(0, settings.length))));

		let serverInfo;
		if (fetchVersion) {
			serverInfo = yield getServerInfo({ server, raiseError: false });
		}

		// Return server version even when offline
		yield put(selectServerSuccess(server, (serverInfo && serverInfo.version) || version));
	} catch (e) {
		log('err_select_server', e);
	}
};

const handleServerRequest = function* handleServerRequest({ server }) {
	try {
		const serverInfo = yield getServerInfo({ server });

		const loginServicesLength = yield RocketChat.getLoginServices(server);
		if (loginServicesLength === 0) {
			Navigation.navigate('LoginView');
		} else {
			Navigation.navigate('LoginSignupView');
		}

		yield put(selectServerRequest(server, serverInfo.version, false));
	} catch (e) {
		yield put(serverFailure());
		log('err_server_request', e);
	}
};

const root = function* root() {
	yield takeLatest(SERVER.SELECT_REQUEST, handleSelectServer);
	yield takeLatest(SERVER.REQUEST, handleServerRequest);
};
export default root;
