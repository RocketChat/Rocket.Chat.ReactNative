import { put, takeLatest, all } from 'redux-saga/effects';
import RNBootSplash from 'react-native-bootsplash';

import MMKV from '../utils/mmkv';
import { selectServerRequest } from '../actions/server';
import { setAllPreferences } from '../actions/sortPreferences';
import { toggleCrashReport } from '../actions/crashReport';
import { APP } from '../actions/actionsTypes';
import RocketChat from '../lib/rocketchat';
import log from '../utils/log';
import database from '../lib/database';
import { localAuthenticate } from '../utils/localAuthentication';
import { appStart, ROOT_OUTSIDE, appReady } from '../actions/app';

export const initLocalSettings = function* initLocalSettings() {
	const sortPreferences = yield RocketChat.getSortPreferences();
	yield put(setAllPreferences(sortPreferences));

	const allowCrashReport = yield RocketChat.getAllowCrashReport();
	yield put(toggleCrashReport(allowCrashReport));
};

const restore = function* restore() {
	try {
		let token; let server;
		try {
			({ token, server } = yield all({
				token: MMKV.getStringAsync(RocketChat.TOKEN_KEY),
				server: MMKV.getStringAsync('currentServer')
			}));
		} catch {
			// Do nothing
		}

		if (!token || !server) {
			yield all([
				MMKV.removeItem(RocketChat.TOKEN_KEY),
				MMKV.removeItem('currentServer')
			]);
			yield put(appStart({ root: ROOT_OUTSIDE }));
		} else {
			const serversDB = database.servers;
			const serverCollections = serversDB.collections.get('servers');

			yield localAuthenticate(server);
			const serverObj = yield serverCollections.find(server);
			yield put(selectServerRequest(server, serverObj && serverObj.version));
		}

		yield put(appReady({}));
	} catch (e) {
		log(e);
		yield put(appStart({ root: ROOT_OUTSIDE }));
	}
};

const start = function start() {
	RNBootSplash.hide();
};

const root = function* root() {
	yield takeLatest(APP.INIT, restore);
	yield takeLatest(APP.START, start);
	yield takeLatest(APP.INIT_LOCAL_SETTINGS, initLocalSettings);
};
export default root;
