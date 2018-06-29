import { AsyncStorage } from 'react-native';
import { delay } from 'redux-saga';
import { put, call, take, takeLatest, select, all } from 'redux-saga/effects';

import * as types from '../actions/actionsTypes';
import { appStart } from '../actions';
import {
	// loginRequest,
	// loginSubmit,
	registerRequest,
	registerIncomplete,
	// loginSuccess,
	loginFailure,
	// logout,
	// setToken,
	registerSuccess,
	setUsernameRequest,
	setUsernameSuccess,
	forgotPasswordSuccess,
	forgotPasswordFailure
} from '../actions/login';
import RocketChat from '../lib/rocketchat';
import log from '../utils/log';
import I18n from '../i18n';

const getUser = state => state.login;
const getServer = state => state.server.server;
const getIsConnected = state => state.meteor.connected;

const loginCall = args => RocketChat.loginWithPassword(args);
const registerCall = args => RocketChat.register(args);
const setUsernameCall = args => RocketChat.setUsername(args);
const loginSuccessCall = () => RocketChat.loginSuccess();
const logoutCall = args => RocketChat.logout(args);
const forgotPasswordCall = args => RocketChat.forgotPassword(args);

const handleLoginSuccess = function* handleLoginSuccess() {
	try {
		const [server, user] = yield all([select(getServer), select(getUser)]);
		yield AsyncStorage.setItem(RocketChat.TOKEN_KEY, user.token);
		yield AsyncStorage.setItem(`${ RocketChat.TOKEN_KEY }-${ server }`, JSON.stringify(user));
		const token = yield AsyncStorage.getItem('pushId');
		if (token) {
			yield RocketChat.registerPushToken(user.user.id, token);
		}
		if (!user.user.username || user.isRegistering) {
			yield put(registerIncomplete());
		} else {
			yield delay(300);
			yield put(appStart('inside'));
		}
	} catch (e) {
		log('handleLoginSuccess', e);
	}
};

const handleRegisterSubmit = function* handleRegisterSubmit({ credentials }) {
	yield put(registerRequest(credentials));
};

const handleRegisterRequest = function* handleRegisterRequest({ credentials }) {
	try {
		yield call(registerCall, { credentials });
		yield put(registerSuccess(credentials));
	} catch (err) {
		yield put(loginFailure(err));
	}
};

const handleRegisterSuccess = function* handleRegisterSuccess({ credentials }) {
	try {
		yield call(loginCall, {
			username: credentials.email,
			password: credentials.pass
		});
	} catch (err) {
		yield put(loginFailure(err));
	}
};

const handleSetUsernameSubmit = function* handleSetUsernameSubmit({ credentials }) {
	yield put(setUsernameRequest(credentials));
};

const handleSetUsernameRequest = function* handleSetUsernameRequest({ credentials }) {
	try {
		yield call(setUsernameCall, { credentials });
		yield put(setUsernameSuccess());
		yield call(loginSuccessCall);
	} catch (err) {
		yield put(loginFailure(err));
	}
};

const handleLogout = function* handleLogout() {
	const server = yield select(getServer);
	if (server) {
		try {
			yield put(appStart('outside'));
			yield delay(300);
			yield call(logoutCall, { server });
		} catch (e) {
			log('handleLogout', e);
		}
	}
};

const handleRegisterIncomplete = function* handleRegisterIncomplete() {
	yield put(appStart('outside'));
};

const handleForgotPasswordRequest = function* handleForgotPasswordRequest({ email }) {
	try {
		yield call(forgotPasswordCall, email);
		yield put(forgotPasswordSuccess());
	} catch (err) {
		yield put(forgotPasswordFailure(err));
	}
};

const watchLoginOpen = function* watchLoginOpen() {
	try {
		const isConnected = yield select(getIsConnected);
		if (!isConnected) {
			yield take(types.METEOR.SUCCESS);
		}
		const sub = yield RocketChat.subscribe('meteor.loginServiceConfiguration');
		yield take(types.LOGIN.CLOSE);
		yield sub.unsubscribe().catch(err => console.warn(err));
	} catch (e) {
		log('watchLoginOpen', e);
	}
};

// eslint-disable-next-line require-yield
const handleSetUser = function* handleSetUser(params) {
	const [server, user] = yield all([select(getServer), select(getUser)]);
	if (params.language) {
		I18n.locale = params.language;
	}
	yield AsyncStorage.setItem(`${ RocketChat.TOKEN_KEY }-${ server }`, JSON.stringify(user));
};

const root = function* root() {
	// yield takeLatest(types.METEOR.SUCCESS, handleLoginWhenServerChanges);
	// yield takeLatest(types.LOGIN.REQUEST, handleLoginRequest);
	yield takeLatest(types.LOGIN.SUCCESS, handleLoginSuccess);
	// yield takeLatest(types.LOGIN.SUBMIT, handleLoginSubmit);
	yield takeLatest(types.LOGIN.REGISTER_REQUEST, handleRegisterRequest);
	yield takeLatest(types.LOGIN.REGISTER_SUBMIT, handleRegisterSubmit);
	yield takeLatest(types.LOGIN.REGISTER_SUCCESS, handleRegisterSuccess);
	yield takeLatest(types.LOGIN.REGISTER_INCOMPLETE, handleRegisterIncomplete);
	yield takeLatest(types.LOGIN.SET_USERNAME_SUBMIT, handleSetUsernameSubmit);
	yield takeLatest(types.LOGIN.SET_USERNAME_REQUEST, handleSetUsernameRequest);
	yield takeLatest(types.LOGOUT, handleLogout);
	yield takeLatest(types.FORGOT_PASSWORD.REQUEST, handleForgotPasswordRequest);
	yield takeLatest(types.LOGIN.OPEN, watchLoginOpen);
	yield takeLatest(types.USER.SET, handleSetUser);
};
export default root;
