import { takeLatest, select } from 'redux-saga/effects';
import { FOREGROUND, BACKGROUND, INACTIVE } from 'redux-enhancer-react-native-appstate';
import { Answers } from 'react-native-fabric';
import RocketChat from '../lib/rocketchat';

const appHasComeBackToForeground = function* appHasComeBackToForeground() {
	const auth = yield select(state => state.login.isAuthenticated);
	if (!auth) {
		return;
	}
	try {
		return yield RocketChat.setUserPresenceOnline();
	} catch (e) {
		Answers.logCustom('appHasComeBackToForeground', e);
		if (__DEV__) {
			console.warn('appHasComeBackToForeground', e);
		}
	}
};

const appHasComeBackToBackground = function* appHasComeBackToBackground() {
	const auth = yield select(state => state.login.isAuthenticated);
	if (!auth) {
		return;
	}
	try {
		return yield RocketChat.setUserPresenceAway();
	} catch (e) {
		Answers.logCustom('appHasComeBackToBackground', e);
		if (__DEV__) {
			console.warn('appHasComeBackToBackground', e);
		}
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
	yield takeLatest(
		INACTIVE,
		appHasComeBackToBackground
	);
};

export default root;
