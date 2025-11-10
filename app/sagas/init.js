import { call, put, select, takeLatest } from 'redux-saga/effects';
import RNBootSplash from 'react-native-bootsplash';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import { CURRENT_SERVER, TOKEN_KEY } from '../lib/constants/keys';
import UserPreferences, { initializeStorage } from '../lib/methods/userPreferences';
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

const ensureServersInDatabase = async () => {
	const prefix = `${TOKEN_KEY}-`;
	const keys = UserPreferences.getAllKeys();
	const serverUrls = Array.from(
		new Set(
			keys
				.filter(key => key.startsWith(prefix))
				.map(key => key.slice(prefix.length))
				.filter(serverKey => serverKey.startsWith('http://') || serverKey.startsWith('https://'))
		)
	);

	if (serverUrls.length === 0) {
		return;
	}

	const serversDB = database.servers;
	const serverCollection = serversDB.get('servers');
	const existingRecords = await serverCollection.query().fetch();
	const existingIds = new Set(existingRecords.map(record => record.id));

	const missingServers = serverUrls.filter(url => !existingIds.has(url));
	if (!missingServers.length) {
		return;
	}

	await serversDB.write(() =>
		Promise.all(
			missingServers.map(url =>
				serverCollection.create((record) => {
					record._raw = sanitizedRaw({ id: url }, serverCollection.schema);
					record.name = url;
				})
			)
		)
	);
};

const restore = function* restore() {
	try {
		// IMPORTANT: Initialize MMKV storage FIRST
		// Native migration has already completed in AppDelegate
		// This connects JavaScript to the migrated data
		yield call(initializeStorage);
		yield call(ensureServersInDatabase);

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
			try {
				yield localAuthenticate(server);
			} catch (error) {
				// Ignore local authentication failures during restore
			}
			const serverRecord = yield getServerById(server);
			if (!serverRecord) {
				yield put(selectServerRequest(server));
				return;
			}
			yield put(selectServerRequest(server, serverRecord.version));
		}

		yield put(appReady({}));

		const pushNotification = yield call(AsyncStorage.getItem, 'pushNotification');
		if (pushNotification) {
			yield call(AsyncStorage.removeItem, 'pushNotification');
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
