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
 * One-time migration: move auth tokens from the legacy non-server-scoped slot
 * `${TOKEN_KEY}-${userId}` to the server-scoped slot `${TOKEN_KEY}-${server}-${userId}`.
 * See `getUserTokenKey` for why the legacy scheme was ambiguous (token confusion).
 *
 * Done in two passes so a userId shared by multiple servers is copied to every server's
 * slot before any legacy slot is removed.
 */
const migrateTokenKeysToServerScoped = function* migrateTokenKeysToServerScoped() {
	try {
		if (UserPreferences.getBool(TOKEN_KEY_SERVER_SCOPED_MIGRATED)) {
			return;
		}
		const serversDB = database.servers;
		const servers = yield serversDB.get('servers').query().fetch();
		const legacyKeys = [];
		// Pass 1: copy each server's token into the new server-scoped slot.
		for (let i = 0; i < servers.length; i += 1) {
			const server = servers[i].id;
			const userId = UserPreferences.getString(`${TOKEN_KEY}-${server}`);
			if (!userId) {
				continue;
			}
			const newKey = getUserTokenKey(server, userId);
			if (!UserPreferences.getString(newKey)) {
				const legacyKey = `${TOKEN_KEY}-${userId}`;
				const token = UserPreferences.getString(legacyKey);
				if (token) {
					UserPreferences.setString(newKey, token);
					legacyKeys.push(legacyKey);
				}
			}
		}
		// Pass 2: drop the legacy slots now that every server has been migrated.
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
