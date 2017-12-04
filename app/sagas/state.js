import { takeLatest, select } from 'redux-saga/effects';
import { FOREGROUND, BACKGROUND, INACTIVE } from 'redux-enhancer-react-native-appstate';

import RocketChat from '../lib/rocketchat';

const appHasComeBackToForeground = function* appHasComeBackToForeground() {
	const auth = yield select(state => state.login.isAuthenticated);
	if (!auth) {
		return;
	}
	return yield RocketChat.setUserPresenceOnline();
};

const appHasComeBackToBackground = function* appHasComeBackToBackground() {
	const auth = yield select(state => state.login.isAuthenticated);
	if (!auth) {
		return;
	}
	return yield RocketChat.setUserPresenceAway();
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
	yield takeLatest(
		INACTIVE,
		appHasComeBackToBackground
	);
};

export default root;
