import { takeLatest, select } from 'redux-saga/effects';

import RocketChat from '../lib/rocketchat';
import { setBadgeCount } from '../notifications/push';
import log from '../utils/log';
import { localAuthenticate, saveLastLocalAuthenticationSession } from '../utils/localAuthentication';
import { APP_STATE } from '../actions/actionsTypes';
import { ROOT_OUTSIDE } from '../actions/app';

const appHasComeBackToForeground = function* appHasComeBackToForeground() {
	const appRoot = yield select(state => state.app.root);
	if (appRoot === ROOT_OUTSIDE) {
		return;
	}
	const login = yield select(state => state.login);
	const server = yield select(state => state.server);
	if (!login.isAuthenticated || login.isFetching || server.connecting || server.loading || server.changingServer) {
		return;
	}
	try {
		yield localAuthenticate(server.server);
		RocketChat.checkAndReopen();
		setBadgeCount();
		return yield RocketChat.setUserPresenceOnline();
	} catch (e) {
		log(e);
	}
};

const appHasComeBackToBackground = function* appHasComeBackToBackground() {
	const appRoot = yield select(state => state.app.root);
	if (appRoot === ROOT_OUTSIDE) {
		return;
	}
	try {
		const server = yield select(state => state.server.server);
		yield saveLastLocalAuthenticationSession(server);

		yield RocketChat.setUserPresenceAway();
	} catch (e) {
		log(e);
	}
};

const root = function* root() {
	yield takeLatest(APP_STATE.FOREGROUND, appHasComeBackToForeground);
	yield takeLatest(APP_STATE.BACKGROUND, appHasComeBackToBackground);
};

export default root;
