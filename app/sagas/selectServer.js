import {
	put, take, takeLatest, fork, cancel, race
} from 'redux-saga/effects';
import { Alert } from 'react-native';
import RNUserDefaults from 'rn-user-defaults';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import semver from 'semver';

import Navigation from '../lib/Navigation';
import { SERVER } from '../actions/actionsTypes';
import * as actions from '../actions';
import {
	serverFailure, selectServerRequest, selectServerSuccess, selectServerFailure
} from '../actions/server';
import { setUser } from '../actions/login';
import RocketChat from '../lib/rocketchat';
import database from '../lib/database';
import log from '../utils/log';
import { extractHostname } from '../utils/server';
import I18n from '../i18n';
import { SERVERS, TOKEN, SERVER_URL } from '../constants/userDefaults';

const getServerInfo = function* getServerInfo({ server, raiseError = true }) {
	try {
		const serverInfo = yield RocketChat.getServerInfo(server);
		let websocketInfo = { success: true };
		if (raiseError) {
			websocketInfo = yield RocketChat.getWebsocketInfo({ server });
		}
		if (!serverInfo.success || !websocketInfo.success) {
			if (raiseError) {
				const info = serverInfo.success ? websocketInfo : serverInfo;
				Alert.alert(I18n.t('Oops'), I18n.t(info.message, info.messageOptions));
			}
			yield put(serverFailure());
			return;
		}

		const validVersion = semver.coerce(serverInfo.version);

		const serversDB = database.servers;
		const serversCollection = serversDB.collections.get('servers');
		yield serversDB.action(async() => {
			try {
				const serverRecord = await serversCollection.find(server);
				await serverRecord.update((record) => {
					record.version = validVersion;
				});
			} catch (e) {
				await serversCollection.create((record) => {
					record._raw = sanitizedRaw({ id: server }, serversCollection.schema);
					record.version = validVersion;
				});
			}
		});

		return serverInfo;
	} catch (e) {
		log(e);
	}
};

const handleSelectServer = function* handleSelectServer({ server, version, fetchVersion }) {
	try {
		const serversDB = database.servers;
		yield RNUserDefaults.set('currentServer', server);
		const userId = yield RNUserDefaults.get(`${ RocketChat.TOKEN_KEY }-${ server }`);
		const userCollections = serversDB.collections.get('users');
		let user = null;
		if (userId) {
			try {
				const userRecord = yield userCollections.find(userId);
				user = {
					id: userRecord.id,
					token: userRecord.token,
					username: userRecord.username,
					name: userRecord.name,
					language: userRecord.language,
					status: userRecord.status,
					roles: userRecord.roles
				};
			} catch (e) {
				// We only run it if not has user on DB
				const servers = yield RNUserDefaults.objectForKey(SERVERS);
				const userCredentials = servers && servers.find(srv => srv[SERVER_URL] === server);
				user = userCredentials && {
					token: userCredentials[TOKEN]
				};
			}
		}

		if (user) {
			yield RocketChat.connect({ server, user, logoutOnError: true });
			yield put(setUser(user));
			yield put(actions.appStart('inside'));
		} else {
			yield RocketChat.connect({ server });
			yield put(actions.appStart('outside'));
		}

		// We can't use yield here because fetch of Settings & Custom Emojis is slower
		// and block the selectServerSuccess raising multiples errors
		RocketChat.setSettings();
		RocketChat.setCustomEmojis();

		let serverInfo;
		if (fetchVersion) {
			serverInfo = yield getServerInfo({ server, raiseError: false });
		}

		// Return server version even when offline
		yield put(selectServerSuccess(server, (serverInfo && serverInfo.version) || version));
	} catch (e) {
		yield put(selectServerFailure());
		log(e);
	}
};

const handleServerRequest = function* handleServerRequest({ server, certificate }) {
	try {
		if (certificate) {
			yield RNUserDefaults.setObjectForKey(extractHostname(server), certificate);
		}

		const serverInfo = yield getServerInfo({ server });

		if (serverInfo) {
			const loginServicesLength = yield RocketChat.getLoginServices(server);
			if (loginServicesLength === 0) {
				Navigation.navigate('LoginView');
			} else {
				Navigation.navigate('LoginSignupView');
			}
			yield put(selectServerRequest(server, serverInfo.version, false));
		}
	} catch (e) {
		yield put(serverFailure());
		log(e);
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
