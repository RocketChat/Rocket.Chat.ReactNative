import { takeLatest, select } from 'redux-saga/effects';
import { FOREGROUND, BACKGROUND } from 'redux-enhancer-react-native-appstate';

import RocketChat from '../lib/rocketchat';
import { setBadgeCount } from '../notifications/push';
import log from '../utils/log';

const appHasComeBackToForeground = function* appHasComeBackToForeground() {
	const appRoot = yield select(state => state.app.root);
	if (appRoot === 'outside') {
		return;
	}
	const auth = yield select(state => state.login.isAuthenticated);
	if (!auth) {
		return;
	}
	try {
		setBadgeCount();
		return yield RocketChat.setUserPresenceOnline();
	} catch (e) {
		log(e);
	}
};

const appHasComeBackToBackground = function* appHasComeBackToBackground() {
	const appRoot = yield select(state => state.app.root);
	if (appRoot === 'outside') {
		return;
	}
	const auth = yield select(state => state.login.isAuthenticated);
	if (!auth) {
		return;
	}
	try {
		return yield RocketChat.setUserPresenceAway();
	} catch (e) {
		log(e);
	}
};

const root = function* root() {
	yield takeLatest(
		FOREGROUND,
		appHasComeBackToForeground
	);
	yield takeLatest(
		BACKGROUND,
		appHasComeBackToBackground
	);
	// yield takeLatest(
	// 	INACTIVE,
	// 	appHasComeBackToBackground
	// );
};

export default root;
