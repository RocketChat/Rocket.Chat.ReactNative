import { select, takeLatest } from 'redux-saga/effects';

import log from '../lib/methods/helpers/log';
import { localAuthenticate, saveLastLocalAuthenticationSession } from '../lib/methods/helpers/localAuthentication';
import { APP_STATE } from '../actions/actionsTypes';
import { RootEnum } from '../definitions/redux/TRootEnum';
import { recoverSocket } from '../lib/services/socketHealth';
import { setUserPresenceOnline, setUserPresenceAway } from '../lib/services/restApi';
import { checkPendingNotification } from '../lib/notifications';
import NativePrivacyCover from '../lib/native/NativePrivacyCover';

const isAuthAndConnected = function* isAuthAndConnected() {
	const login = yield select(state => state.login);
	const meteor = yield select(state => state.meteor);
	return login.isAuthenticated && meteor.connected;
};

const authenticateOnForeground = function* authenticateOnForeground() {
	const appRoot = yield select(state => state.app.root);
	if (appRoot !== RootEnum.ROOT_INSIDE) {
		return false;
	}
	// Socket state is deliberately not checked here: a closed socket is the case
	// recoverSocket below exists for.
	const { isAuthenticated } = yield select(state => state.login);
	if (!isAuthenticated) {
		return false;
	}
	const server = yield select(state => state.server.server);
	yield localAuthenticate(server);
	return true;
};

const resumeSessionOnForeground = function* resumeSessionOnForeground() {
	recoverSocket().catch(e => log(e));
	checkPendingNotification().catch(e => {
		log('[state.js] Error checking pending notification:', e);
	});
	try {
		yield setUserPresenceOnline();
	} catch (e) {
		log(e);
	}
};

const appHasComeBackToForeground = function* appHasComeBackToForeground() {
	const coverToken = NativePrivacyCover.getCoverToken();
	let isAuthenticatedOnForeground = false;
	try {
		isAuthenticatedOnForeground = yield authenticateOnForeground();
	} catch (e) {
		log(e);
	}
	NativePrivacyCover.releaseCover(coverToken);
	if (isAuthenticatedOnForeground) {
		yield resumeSessionOnForeground();
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

const root = function* root() {
	yield takeLatest(APP_STATE.FOREGROUND, appHasComeBackToForeground);
	yield takeLatest(APP_STATE.BACKGROUND, appHasComeBackToBackground);
};

export default root;
