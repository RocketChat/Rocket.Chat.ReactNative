import { takeLatest } from 'redux-saga/effects';
import { FOREGROUND, BACKGROUND, INACTIVE } from 'redux-enhancer-react-native-appstate';

const appHasComeBackToForeground = function* appHasComeBackToForeground() {
	yield console.log('appHasComeBackToForeground');
};

const root = function* root() {
	yield takeLatest(
		FOREGROUND,
		appHasComeBackToForeground
	);
	yield takeLatest(
		BACKGROUND,
		appHasComeBackToForeground
	);
	yield takeLatest(
		INACTIVE,
		appHasComeBackToForeground
	);
};

export default root;
