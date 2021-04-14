import { put, takeLatest, all } from 'redux-saga/effects';
import RNBootSplash from 'react-native-bootsplash';

// import * as actions from '../actions';
import { selectServerRequest, serverRequest } from '../actions/server';
// import { selectServerRequest } from '../actions/server';
import UserPreferences from '../lib/userPreferences';
import { setAllPreferences } from '../actions/sortPreferences';
import { toggleCrashReport, toggleAnalyticsEvents } from '../actions/crashReport';
import { APP } from '../actions/actionsTypes';
import RocketChat from '../lib/rocketchat';
import log from '../utils/log';
import database from '../lib/database';
import appConfig from '../../app.json';
import { localAuthenticate } from '../utils/localAuthentication';
import { appStart, ROOT_OUTSIDE, appReady } from '../actions/app';

export const initLocalSettings = function* initLocalSettings() {
	const sortPreferences = yield RocketChat.getSortPreferences();
	yield put(setAllPreferences(sortPreferences));

	const allowCrashReport = yield RocketChat.getAllowCrashReport();
	yield put(toggleCrashReport(allowCrashReport));

	const allowAnalyticsEvents = yield RocketChat.getAllowAnalyticsEvents();
	yield put(toggleAnalyticsEvents(allowAnalyticsEvents));
};

const restore = function* restore() {
	try {
		const server = yield UserPreferences.getStringAsync(RocketChat.CURRENT_SERVER);
		const userId = yield UserPreferences.getStringAsync(`${ RocketChat.TOKEN_KEY }-${ server }`);

		if (!userId || !server) {
			yield all([
				UserPreferences.removeItem(RocketChat.TOKEN_KEY),
				UserPreferences.removeItem(RocketChat.CURRENT_SERVER)
			]);
			yield put(serverRequest(appConfig.server));
			yield put(appStart({ root: ROOT_OUTSIDE }));
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
