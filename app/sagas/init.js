import { call, put, select, takeLatest } from 'redux-saga/effects';
import RNBootSplash from 'react-native-bootsplash';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { CURRENT_SERVER } from '../lib/constants/keys';
import UserPreferences from '../lib/methods/userPreferences';
import { findLoggedInServer, isLoggedInServer } from '../lib/methods/loggedInServer';
import { selectServerRequest } from '../actions/server';
import { setAllPreferences } from '../actions/sortPreferences';
import { APP } from '../actions/actionsTypes';
import log from '../lib/methods/helpers/log';
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

const serverToRestore = async server => {
	const restoredServer = isLoggedInServer(server) ? await getServerById(server) : await findLoggedInServer();

	if (restoredServer) {
		await localAuthenticate(restoredServer.id);
	}

	return restoredServer;
};

const restore = function* restore() {
	try {
		const server = UserPreferences.getString(CURRENT_SERVER);
		const restoredServer = yield call(serverToRestore, server);

		if (restoredServer) {
			yield put(selectServerRequest(restoredServer.id, restoredServer.version));
		} else {
			yield put(appStart({ root: RootEnum.ROOT_OUTSIDE }));
		}

		yield put(appReady({}));
		const pushNotification = yield call(AsyncStorage.getItem, 'pushNotification');
		if (pushNotification) {
			yield call(AsyncStorage.removeItem, 'pushNotification');
			if (restoredServer) {
				try {
					yield put(deepLinkingClickCallPush(JSON.parse(pushNotification)));
				} catch (e) {
					log(e);
				}
			}
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
