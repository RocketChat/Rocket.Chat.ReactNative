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
import { localAuthenticate, UserCanceledError } from '../lib/methods/helpers/localAuthentication';
import { runBiometricTrustMigration } from '../lib/biometricTrustStore/migration';
import { appReady, appStart } from '../actions/app';
import { RootEnum } from '../definitions';
import { getSortPreferences } from '../lib/methods/userPreferencesMethods';
import { deepLinkingClickCallPush } from '../actions/deepLinking';
import { getServerById } from '../lib/database/services/Server';

const PUSH_NOTIFICATION_KEY = 'pushNotification';

export const initLocalSettings = function* initLocalSettings() {
	const sortPreferences = getSortPreferences();
	yield put(setAllPreferences(sortPreferences));
};

const restoreServer = async () => {
	const server = UserPreferences.getString(CURRENT_SERVER);
	const restoredServer = isLoggedInServer(server) ? await getServerById(server) : await findLoggedInServer();

	if (restoredServer) {
		try {
			await localAuthenticate(restoredServer.id);
		} catch (e) {
			// A superseded unlock still has a newer modal gating the screen, so keep booting.
			if (!(e instanceof UserCanceledError)) {
				throw e;
			}
		}
	}

	return restoredServer;
};

const getServerToRestore = function* getServerToRestore() {
	try {
		return (yield call(restoreServer)) || null;
	} catch (e) {
		log(e);
		return null;
	}
};

const deliverPendingPushNotification = function* deliverPendingPushNotification(restoredServer) {
	try {
		const pushNotification = yield call(AsyncStorage.getItem, PUSH_NOTIFICATION_KEY);
		if (!pushNotification) {
			return;
		}

		yield call(AsyncStorage.removeItem, PUSH_NOTIFICATION_KEY);

		if (restoredServer) {
			yield put(deepLinkingClickCallPush(JSON.parse(pushNotification)));
		}
	} catch (e) {
		log(e);
	}
};

const restore = function* restore() {
	yield call(runBiometricTrustMigration);

	const restoredServer = yield* getServerToRestore();

	if (restoredServer) {
		yield put(selectServerRequest(restoredServer.id, restoredServer.version));
	} else {
		yield put(appStart({ root: RootEnum.ROOT_OUTSIDE }));
	}

	yield put(appReady({}));

	yield* deliverPendingPushNotification(restoredServer);
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
