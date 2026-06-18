import { call, put, select, takeLatest } from 'redux-saga/effects';
import RNBootSplash from 'react-native-bootsplash';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { CURRENT_SERVER, TOKEN_KEY } from '../lib/constants/keys';
import UserPreferences from '../lib/methods/userPreferences';
import { selectServerRequest } from '../actions/server';
import { setAllPreferences } from '../actions/sortPreferences';
import { APP } from '../actions/actionsTypes';
import log from '../lib/methods/helpers/log';
import database from '../lib/database';
import { localAuthenticate, UserCanceledError } from '../lib/methods/helpers/localAuthentication';
import { runBiometricTrustMigration } from '../lib/biometricTrustStore/migration';
import { appReady, appStart } from '../actions/app';
import { RootEnum } from '../definitions';
import { getSortPreferences } from '../lib/methods/userPreferencesMethods';
import { deepLinkingClickCallPush } from '../actions/deepLinking';
import { getServerById } from '../lib/database/services/Server';

export const initLocalSettings = function* initLocalSettings() {
	const sortPreferences = getSortPreferences();
	yield put(setAllPreferences(sortPreferences));
};

const restore = function* restore() {
	try {
		yield call(runBiometricTrustMigration);
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
			} catch (e) {
				// A concurrent unlock (cold-boot deep-link/push race) superseded this one. The newer
				// modal will gate the screen — keep booting instead of ejecting to the login screen.
				if (!(e instanceof UserCanceledError)) {
					throw e; // real failure → outer catch → ROOT_OUTSIDE
				}
			}
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
