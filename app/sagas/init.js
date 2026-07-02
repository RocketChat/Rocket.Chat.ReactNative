import { call, put, select, takeLatest } from 'redux-saga/effects';
import RNBootSplash from 'react-native-bootsplash';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { CURRENT_SERVER, TOKEN_KEY, getUserTokenKey } from '../lib/constants/keys';
import UserPreferences from '../lib/methods/userPreferences';
import { selectServerRequest } from '../actions/server';
import { setAllPreferences } from '../actions/sortPreferences';
import { APP } from '../actions/actionsTypes';
import log from '../lib/methods/helpers/log';
import database from '../lib/database';
import { localAuthenticate } from '../lib/methods/helpers/localAuthentication';
import { appReady, appStart } from '../actions/app';
import { RootEnum } from '../definitions';
import { getSortPreferences } from '../lib/methods/userPreferencesMethods';
import { deepLinkingClickCallPush } from '../actions/deepLinking';
import { getServerById } from '../lib/database/services/Server';

export const initLocalSettings = function* initLocalSettings() {
	const sortPreferences = getSortPreferences();
	yield put(setAllPreferences(sortPreferences));
};

const TOKEN_KEY_SERVER_SCOPED_MIGRATED = 'RC_TOKEN_KEY_SERVER_SCOPED_MIGRATED';

/**
 * One-time migration of auth tokens from the legacy `${TOKEN_KEY}-${userId}` slot to the
 * server-scoped `${TOKEN_KEY}-${server}-${userId}` slot (see `getUserTokenKey`). Only userIds
 * owned by a single server are migrated; ambiguous ones are dropped, forcing re-authentication.
 */
export const migrateTokenKeysToServerScoped = function* migrateTokenKeysToServerScoped() {
	try {
		if (UserPreferences.getBool(TOKEN_KEY_SERVER_SCOPED_MIGRATED)) {
			return;
		}
		const serversDB = database.servers;
		const servers = yield serversDB.get('servers').query().fetch();

		// Map each server to its userId and count how many servers reference each userId.
		const serverUserIds = [];
		const serverCountByUserId = {};
		for (let i = 0; i < servers.length; i += 1) {
			const server = servers[i].id;
			const userId = UserPreferences.getString(`${TOKEN_KEY}-${server}`);
			if (!userId) {
				continue;
			}
			serverUserIds.push({ server, userId });
			serverCountByUserId[userId] = (serverCountByUserId[userId] || 0) + 1;
		}

		// Collected in a Set so an ambiguous userId shared by N servers is removed once.
		const legacyKeys = new Set();
		for (let i = 0; i < serverUserIds.length; i += 1) {
			const { server, userId } = serverUserIds[i];
			const legacyKey = `${TOKEN_KEY}-${userId}`;
			// Ambiguous: don't migrate, just drop the legacy slot so the session re-authenticates.
			if (serverCountByUserId[userId] > 1) {
				legacyKeys.add(legacyKey);
				continue;
			}
			const newKey = getUserTokenKey(server, userId);
			if (!UserPreferences.getString(newKey)) {
				const token = UserPreferences.getString(legacyKey);
				if (token) {
					UserPreferences.setString(newKey, token);
					legacyKeys.add(legacyKey);
				}
			}
		}
		// Drop the legacy slots (migrated and ambiguous alike) now that the migration is done.
		legacyKeys.forEach(key => UserPreferences.removeItem(key));
		UserPreferences.setBool(TOKEN_KEY_SERVER_SCOPED_MIGRATED, true);
	} catch (e) {
		log(e);
	}
};

const restore = function* restore() {
	try {
		yield call(migrateTokenKeysToServerScoped);

		const server = UserPreferences.getString(CURRENT_SERVER);
		let userId = UserPreferences.getString(`${TOKEN_KEY}-${server}`);

		if (!server) {
			yield put(appStart({ root: RootEnum.ROOT_OUTSIDE }));
		} else if (!userId) {
			const serversDB = database.servers;
			const serversCollection = serversDB.get('servers');
			const servers = yield serversCollection.query().fetch();

			// Check if there're other logged in servers and picks first one
			if (servers.length > 0) {
				for (let i = 0; i < servers.length; i += 1) {
					const newServer = servers[i].id;
					userId = UserPreferences.getString(`${TOKEN_KEY}-${newServer}`);
					if (userId) {
						return yield put(selectServerRequest(newServer, newServer.version));
					}
				}
			}
			yield put(appStart({ root: RootEnum.ROOT_OUTSIDE }));
		} else {
			yield localAuthenticate(server);
			const serverRecord = yield getServerById(server);
			if (!serverRecord) {
				return;
			}
			yield put(selectServerRequest(server, serverRecord.version));
		}

		yield put(appReady({}));
		const pushNotification = yield call(AsyncStorage.getItem, 'pushNotification');
		if (pushNotification) {
			const pushNotification = yield call(AsyncStorage.removeItem, 'pushNotification');
			yield call(deepLinkingClickCallPush, JSON.parse(pushNotification));
		}
	} catch (e) {
		log(e);
		yield put(appStart({ root: RootEnum.ROOT_OUTSIDE }));
	}
};

const start = function* start() {
	const currentRoot = yield select(state => state.app.root);

	if (currentRoot !== RootEnum.ROOT_LOADING_SHARE_EXTENSION) {
		yield RNBootSplash.hide({ fade: true });
	}
};

const root = function* root() {
	yield takeLatest(APP.INIT, restore);
	yield takeLatest(APP.START, start);
	yield takeLatest(APP.INIT_LOCAL_SETTINGS, initLocalSettings);
};
export default root;
