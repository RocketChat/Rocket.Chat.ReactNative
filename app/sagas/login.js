import { AsyncStorage } from 'react-native';
import {
	put, call, takeLatest, select
} from 'redux-saga/effects';
import { Navigation } from 'react-native-navigation';

import * as types from '../actions/actionsTypes';
import { appStart } from '../actions';
import { serverFinishAdd } from '../actions/server';
import {
	registerRequest,
	loginFailure,
	loginSuccess,
	setUsernameRequest,
	setUsernameSuccess,
	forgotPasswordSuccess,
	forgotPasswordFailure
} from '../actions/login';
import RocketChat from '../lib/rocketchat';
import log from '../utils/log';
import I18n from '../i18n';

const getServer = state => state.server.server;

const loginWithPasswordCall = args => RocketChat.loginWithPassword(args);
const loginCall = args => RocketChat.login(args);
const registerCall = args => RocketChat.register(args);
const setUsernameCall = args => RocketChat.setUsername(args);
const loginSuccessCall = () => RocketChat.loginSuccess();
const logoutCall = args => RocketChat.logout(args);
const forgotPasswordCall = args => RocketChat.forgotPassword(args);

const handleLoginRequest = function* handleLoginRequest({ credentials }) {
	try {
		let result;
		if (credentials.resume) {
			result = yield call(loginCall, credentials);
		} else {
			result = yield call(loginWithPasswordCall, credentials);
		}
		if (result.status && result.status === 'success') {
			return yield put(loginSuccess(result.data));
		}
	} catch (error) {
		yield put(loginFailure(error));
	}
};

const handleLoginSuccess = function* handleLoginSuccess({ user }) {
	const adding = yield select(state => state.server.adding);
	yield AsyncStorage.setItem(RocketChat.TOKEN_KEY, user.authToken);

	if (user.me && !user.me.username) {
		return yield put(appStart('setUsername'));
	}

	if (adding) {
		yield put(serverFinishAdd());
		yield Navigation.dismissAllModals();
	} else {
		yield put(appStart('inside'));
	}
	const server = yield select(getServer);
	try {
		const result = {
			id: user.userId,
			token: user.authToken,
			username: user.me.username,
			name: user.me.name,
			language: user.me.language
		};
		RocketChat.loginSuccess({ user: result, server });
		I18n.locale = result.language;
		yield AsyncStorage.setItem(`${ RocketChat.TOKEN_KEY }-${ server }`, JSON.stringify(result));
	} catch (error) {
		console.log("​loginSuccess saga -> error", error);
	}
};

const handleRegisterSubmit = function* handleRegisterSubmit({ credentials }) {
	yield put(registerRequest(credentials));
};

const handleRegisterRequest = function* handleRegisterRequest({ credentials }) {
	try {
		yield call(registerCall, { credentials });
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
		yield call(setUsernameCall, credentials);
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
			yield call(logoutCall, { server });
			yield put(appStart('outside'));
		} catch (e) {
			log('handleLogout', e);
		}
	}
};

const handleForgotPasswordRequest = function* handleForgotPasswordRequest({ email }) {
	try {
		yield call(forgotPasswordCall, email);
		yield put(forgotPasswordSuccess());
	} catch (err) {
		yield put(forgotPasswordFailure(err));
	}
};

const handleSetUser = function handleSetUser({ user }) {
	if (user && user.language) {
		I18n.locale = user.language;
	}
};

const root = function* root() {
	yield takeLatest(types.LOGIN.REQUEST, handleLoginRequest);
	yield takeLatest(types.LOGIN.SUCCESS, handleLoginSuccess);
	yield takeLatest(types.LOGIN.REGISTER_REQUEST, handleRegisterRequest);
	yield takeLatest(types.LOGIN.REGISTER_SUBMIT, handleRegisterSubmit);
	yield takeLatest(types.LOGIN.SET_USERNAME_SUBMIT, handleSetUsernameSubmit);
	yield takeLatest(types.LOGIN.SET_USERNAME_REQUEST, handleSetUsernameRequest);
	yield takeLatest(types.LOGOUT, handleLogout);
	yield takeLatest(types.FORGOT_PASSWORD.REQUEST, handleForgotPasswordRequest);
	yield takeLatest(types.USER.SET, handleSetUser);
};
export default root;
