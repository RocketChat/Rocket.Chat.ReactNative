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

const getServerInfo = function* getServerInfo({ server }) {
	try {
		const serverInfo = yield RocketChat.getServerInfo(server);
		if (!serverInfo.success) {
			Alert.alert(I18n.t('Oops'), I18n.t(serverInfo.message, serverInfo.messageOptions));
			yield put(serverFailure());
			return;
		}

		database.databases.serversDB.write(() => {
			database.databases.serversDB.create('servers', { id: server, version: serverInfo.version }, true);
		});

		return serverInfo;
	} catch (e) {
		log('getServerInfo', e);
	}
};

const handleSelectServer = function* handleSelectServer({ server, version, fetchVersion }) {
	try {
		let serverInfo;
		if (fetchVersion) {
			serverInfo = yield getServerInfo({ server });
		}
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
		const emojis = database.objects('customEmojis');
		yield put(actions.setCustomEmojis(RocketChat.parseEmojis(emojis.slice(0, emojis.length))));

		yield put(selectServerSuccess(server, fetchVersion ? serverInfo && serverInfo.version : version));
	} catch (e) {
		log('handleSelectServer', e);
	}
};

const handleServerRequest = function* handleServerRequest({ server }) {
	try {
		const serverInfo = yield getServerInfo({ server });

		// TODO: cai aqui O.o
		const loginServicesLength = yield RocketChat.getLoginServices(server);
		if (loginServicesLength === 0) {
			Navigation.navigate('LoginView');
		} else {
			Navigation.navigate('LoginSignupView');
		}

		yield put(selectServerRequest(server, serverInfo.version, false));
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
