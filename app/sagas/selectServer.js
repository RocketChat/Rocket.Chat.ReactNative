import {
	put, take, takeLatest, fork, cancel, race
} from 'redux-saga/effects';
import { Alert } from 'react-native';
import RNUserDefaults from 'rn-user-defaults';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

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
		if (!serverInfo.success) {
			if (raiseError) {
				Alert.alert(I18n.t('Oops'), I18n.t(serverInfo.message, serverInfo.messageOptions));
			}
			yield put(serverFailure());
			return;
		}

		const serversDB = database.servers;
		const serversCollection = serversDB.collections.get('servers');
		yield serversDB.action(async() => {
			try {
				const serverRecord = await serversCollection.find(server);
				await serverRecord.update((record) => {
					record.version = serverInfo.version;
				});
			} catch (e) {
				await serversCollection.create((record) => {
					record._raw = sanitizedRaw({ id: server }, serversCollection.schema);
					record.version = serverInfo.version;
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
				user = yield userCollections.find(userId);
				user = {
					token: user.token,
					username: user.username,
					name: user.name,
					language: user.language,
					status: user.status,
					roles: user.roles
				};
				user = { ...user, roles: JSON.parse(user.roles) };
			} catch (e) {
				// do nothing?
			}
		}

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

		const db = database.active;
		const serversCollection = db.collections.get('settings');
		const settingsRecords = yield serversCollection.query().fetch();
		const settings = Object.values(settingsRecords).map(item => ({
			_id: item.id,
			valueAsString: item.valueAsString,
			valueAsBoolean: item.valueAsBoolean,
			valueAsNumber: item.valueAsNumber,
			_updatedAt: item._updatedAt
		}));
		yield put(actions.setAllSettings(RocketChat.parseSettings(settings.slice(0, settings.length))));

		yield RocketChat.setCustomEmojis();

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
