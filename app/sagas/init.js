import { put, takeLatest, all } from 'redux-saga/effects';
import RNBootSplash from 'react-native-bootsplash';

import { BIOMETRY_ENABLED_KEY } from '../lib/constants';
import UserPreferences from '../lib/methods/userPreferences';
import { selectServerRequest, serverRequest } from '../actions/server';
import { setAllPreferences } from '../actions/sortPreferences';
import { APP } from '../actions/actionsTypes';
import RocketChat from '../lib/rocketchat';
import log from '../utils/log';
import database from '../lib/database';
import { localAuthenticate } from '../utils/localAuthentication';
import { appReady, appStart } from '../actions/app';
import { RootEnum } from '../definitions';

import appConfig from '../../app.json';

export const initLocalSettings = function* initLocalSettings() {
	const sortPreferences = RocketChat.getSortPreferences();
	yield put(setAllPreferences(sortPreferences));
};

const BIOMETRY_MIGRATION_KEY = 'kBiometryMigration';

const restore = function* restore() {
	try {
		// Migration biometry setting from WatermelonDB to MMKV
		// TODO: remove it after a few versions
		const hasMigratedBiometry = UserPreferences.getBool(BIOMETRY_MIGRATION_KEY);
		if (!hasMigratedBiometry) {
			const serversDB = database.servers;
			const serversCollection = serversDB.get('servers');
			const servers = yield serversCollection.query().fetch();
			const isBiometryEnabled = servers.some(server => !!server.biometry);
			UserPreferences.setBool(BIOMETRY_ENABLED_KEY, isBiometryEnabled);
			UserPreferences.setBool(BIOMETRY_MIGRATION_KEY, true);
		}

		const { server } = appConfig;
		const userId = UserPreferences.getString(`${RocketChat.TOKEN_KEY}-${server}`);

		if (!userId) {
			yield all([UserPreferences.removeItem(RocketChat.TOKEN_KEY), UserPreferences.removeItem(RocketChat.CURRENT_SERVER)]);
			yield put(serverRequest(appConfig.server));
			yield put(appStart({ root: RootEnum.ROOT_OUTSIDE }));
		} else {
			const serversDB = database.servers;
			const serverCollections = serversDB.get('servers');

			let serverObj;
			try {
				yield localAuthenticate(server);
				serverObj = yield serverCollections.find(server);
			} catch {
				// Server not found
			}
			yield put(selectServerRequest(server, serverObj && serverObj.version));
		}

		yield put(appReady({}));
	} catch (e) {
		log(e);
		yield put(appStart({ root: RootEnum.ROOT_OUTSIDE }));
	}
};

const start = function* start() {
	yield RNBootSplash.hide();
};

const root = function* root() {
	yield takeLatest(APP.INIT, restore);
	yield takeLatest(APP.START, start);
	yield takeLatest(APP.INIT_LOCAL_SETTINGS, initLocalSettings);
};
export default root;
