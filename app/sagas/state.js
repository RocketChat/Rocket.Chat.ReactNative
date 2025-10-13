import { select, takeLatest } from 'redux-saga/effects';

import Navigation from '../lib/navigation/appNavigation';
import log from '../lib/methods/helpers/log';
import { localAuthenticate, saveLastLocalAuthenticationSession } from '../lib/methods/helpers/localAuthentication';
import { APP_STATE } from '../actions/actionsTypes';
import { RootEnum } from '../definitions';
import { checkAndReopen } from '../lib/services/connect';
import { setUserPresenceOnline, setUserPresenceAway } from '../lib/services/restApi';

const appHasComeBackToForeground = function* appHasComeBackToForeground() {
	const appRoot = yield select(state => state.app.root);
	if (appRoot === RootEnum.ROOT_OUTSIDE) {
		return;
	}
	const login = yield select(state => state.login);
	const server = yield select(state => state.server);
	if (
		!login.isAuthenticated ||
		login.isFetching ||
		server.connecting ||
		server.loading ||
		server.changingServer ||
		!Navigation.navigationRef.current
	) {
		return;
	}
	try {
		yield localAuthenticate(server.server);
		checkAndReopen();
		return yield setUserPresenceOnline();
	} catch (e) {
		log(e);
	}
};

const appHasComeBackToBackground = function* appHasComeBackToBackground() {
	const appRoot = yield select(state => state.app.root);
	if (appRoot === RootEnum.ROOT_OUTSIDE) {
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
