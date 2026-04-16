import { call, delay, select, takeLatest } from 'redux-saga/effects';

import log from '../lib/methods/helpers/log';
import { localAuthenticate, saveLastLocalAuthenticationSession } from '../lib/methods/helpers/localAuthentication';
import { APP_STATE, METEOR } from '../actions/actionsTypes';
import { RootEnum } from '../definitions';
import { checkAndReopen } from '../lib/services/connect';
import { setUserPresenceOnline, setUserPresenceAway } from '../lib/services/restApi';
import { checkPendingNotification } from '../lib/notifications';
import { refreshDmUsersPresence } from '../lib/methods/getUsersPresence';

const CONNECTION_RETRY_LIMIT = 10;
const CONNECTION_RETRY_DELAY_MS = 1000;

const isAuthAndConnected = function* isAuthAndConnected() {
	const login = yield select(state => state.login);
	const meteor = yield select(state => state.meteor);
	return login.isAuthenticated && meteor.connected;
};

const waitForConnection = function* waitForConnection() {
	let retries = 0;
	let isReady = yield isAuthAndConnected();
	while (!isReady && retries < CONNECTION_RETRY_LIMIT) {
		yield delay(CONNECTION_RETRY_DELAY_MS);
		isReady = yield isAuthAndConnected();
		retries++;
	}
	return isReady;
};

const appHasComeBackToForeground = function* appHasComeBackToForeground() {
	try {
		const appRoot = yield select(state => state.app.root);
		if (appRoot !== RootEnum.ROOT_INSIDE) {
			return;
		}

		const server = yield select(state => state.server.server);
		yield localAuthenticate(server);
		checkAndReopen();

		const isReady = yield waitForConnection();
		if (!isReady) {
			log('[state.js] Connection not ready after retries, aborting foreground tasks');
			return;
		}

		// Refresh presence for DM users to ensure status is up-to-date after background
		yield setUserPresenceOnline();
		yield call(refreshDmUsersPresence);

		// Check for pending notification when app comes to foreground (Android - notification tap while in background)
		checkPendingNotification().catch(e => {
			log(`[state.js] Error checking pending notification: ${e}`);
		});
	} catch (e) {
		log(e);
	}
};

const appHasComeBackToBackground = function* appHasComeBackToBackground() {
	const appRoot = yield select(state => state.app.root);
	if (appRoot !== RootEnum.ROOT_INSIDE) {
		return;
	}
	const isReady = yield isAuthAndConnected();
	if (!isReady) {
		return;
	}
	try {
		const server = yield select(state => state.server.server);
		yield saveLastLocalAuthenticationSession(server);
		yield setUserPresenceAway();
	} catch (e) {
		log(e);
	}
};

const handleMeteorConnect = function* handleMeteorConnect() {
	const appRoot = yield select(state => state.app.root);
	if (appRoot !== RootEnum.ROOT_INSIDE) {
		return;
	}
	try {
		yield call(refreshDmUsersPresence);
	} catch (e) {
		log(`[state.js] Error refreshing DM users presence on connect: ${e}`);
	}
};

const root = function* root() {
	yield takeLatest(APP_STATE.FOREGROUND, appHasComeBackToForeground);
	yield takeLatest(APP_STATE.BACKGROUND, appHasComeBackToBackground);
	yield takeLatest(METEOR.SUCCESS, handleMeteorConnect);
};

export default root;
