import {
	put, take, takeLatest, fork, cancel, race
} from 'redux-saga/effects';
import { Alert } from 'react-native';
import RNUserDefaults from 'rn-user-defaults';

import Navigation from '../lib/Navigation';
import { SERVER } from '../actions/actionsTypes';
import * as actions from '../actions';
import {
	serverFailure, selectServerRequest, selectServerSuccess, selectServerFailure
} from '../actions/server';
import { setUser } from '../actions/login';
import RocketChat from '../lib/rocketchat';
import database from '../lib/realm';
import log from '../utils/log';
import I18n from '../i18n';
import { SERVERS, TOKEN, SERVER_URL } from '../constants/userDefaults';

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
		const { serversDB } = database.databases;

		yield RNUserDefaults.set('currentServer', server);
		const userId = yield RNUserDefaults.get(`${ RocketChat.TOKEN_KEY }-${ server }`);
		const user = userId && serversDB.objectForPrimaryKey('user', userId);

		const servers = yield RNUserDefaults.objectForKey(SERVERS);
		const userCredentials = servers && servers.find(srv => srv[SERVER_URL] === server);
		const userLogin = userCredentials && {
			token: userCredentials[TOKEN]
		};

		if (user || userLogin) {
			yield RocketChat.connect({ server, user: user || userLogin });
			yield put(setUser(user || userLogin));
			yield put(actions.appStart('inside'));
		} else {
			yield RocketChat.connect({ server });
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
		yield put(selectServerFailure());
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
	yield takeLatest(SERVER.REQUEST, handleServerRequest);

	while (true) {
		const params = yield take(SERVER.SELECT_REQUEST);
		const selectServerTask = yield fork(handleSelectServer, params);
		yield race({
			request: take(SERVER.SELECT_REQUEST),
			success: take(SERVER.SELECT_SUCCESS),
			failure: take(SERVER.SELECT_FAILURE)
		});
		yield cancel(selectServerTask);
	}
};
export default root;
