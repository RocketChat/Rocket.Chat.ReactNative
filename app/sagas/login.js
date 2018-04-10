import { AsyncStorage } from 'react-native';
import { put, call, takeLatest, select, all } from 'redux-saga/effects';

import * as types from '../actions/actionsTypes';
import {
	loginRequest,
	loginSubmit,
	registerRequest,
	registerIncomplete,
	loginSuccess,
	loginFailure,
	logout,
	// setToken,
	registerSuccess,
	setUsernameRequest,
	setUsernameSuccess,
	forgotPasswordSuccess,
	forgotPasswordFailure
} from '../actions/login';
import RocketChat from '../lib/rocketchat';
import * as NavigationService from '../containers/routes/NavigationService';

const getUser = state => state.login;
const getServer = state => state.server.server;

const loginCall = args => ((args.resume || args.oauth) ? RocketChat.login(args) : RocketChat.loginWithPassword(args));
const registerCall = args => RocketChat.register(args);
const setUsernameCall = args => RocketChat.setUsername(args);
const logoutCall = args => RocketChat.logout(args);

const forgotPasswordCall = args => RocketChat.forgotPassword(args);

// const getToken = function* getToken() {
// 	const currentServer = yield select(getServer);
// 	const user = yield call([AsyncStorage, 'getItem'], `${ RocketChat.TOKEN_KEY }-${ currentServer }`);
// 	if (user) {
// 		try {
// 			yield put(setToken(JSON.parse(user)));
// 			yield call([AsyncStorage, 'setItem'], RocketChat.TOKEN_KEY, JSON.parse(user).token || '');
// 			return JSON.parse(user);
// 		} catch (e) {
// 			console.log('getTokenerr', e);
// 		}
// 	} else {
// 		return yield put(setToken());
// 	}
// };

// const handleLoginWhenServerChanges = function* handleLoginWhenServerChanges() {
// 	try {
// 		const user = yield call(getToken);
// 		if (user.token) {
// 			yield put(loginRequest({ resume: user.token }));
// 		}
// 	} catch (e) {
// 		console.log(e);
// 	}
// };

const saveToken = function* saveToken() {
	const [server, user] = yield all([select(getServer), select(getUser)]);
	yield AsyncStorage.setItem(RocketChat.TOKEN_KEY, user.token);
	yield AsyncStorage.setItem(`${ RocketChat.TOKEN_KEY }-${ server }`, JSON.stringify(user));
	const token = yield AsyncStorage.getItem('pushId');
	if (token) {
		yield RocketChat.registerPushToken(user.user.id, token);
	}
	if (!user.user.username) {
		yield put(registerIncomplete());
	}
};

const handleLoginRequest = function* handleLoginRequest({ credentials }) {
	try {
		// const server = yield select(getServer);
		const user = yield call(loginCall, credentials);
		yield put(loginSuccess(user));
	} catch (err) {
		if (err.error === 403) {
			return yield put(logout());
		}
		yield put(loginFailure(err));
	}
};

const handleLoginSubmit = function* handleLoginSubmit({ credentials }) {
	yield put(loginRequest(credentials));
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
	yield put(loginSubmit({
		username: credentials.email,
		password: credentials.pass
	}));
};

const handleSetUsernameSubmit = function* handleSetUsernameSubmit({ credentials }) {
	yield put(setUsernameRequest(credentials));
};

const handleSetUsernameRequest = function* handleSetUsernameRequest({ credentials }) {
	try {
		yield call(setUsernameCall, { credentials });
		yield put(setUsernameSuccess());
	} catch (err) {
		yield put(loginFailure(err));
	}
};

const handleLogout = function* handleLogout() {
	const server = yield select(getServer);
	if (server) {
		yield call(logoutCall, { server });
	}
};

const handleRegisterIncomplete = function* handleRegisterIncomplete() {
	yield call(NavigationService.navigate, 'Register');
};

const handleForgotPasswordRequest = function* handleForgotPasswordRequest({ email }) {
	try {
		yield call(forgotPasswordCall, email);
		yield put(forgotPasswordSuccess());
	} catch (err) {
		yield put(forgotPasswordFailure(err));
	}
};

const root = function* root() {
	// yield takeLatest(types.METEOR.SUCCESS, handleLoginWhenServerChanges);
	yield takeLatest(types.LOGIN.REQUEST, handleLoginRequest);
	yield takeLatest(types.LOGIN.SUCCESS, saveToken);
	yield takeLatest(types.LOGIN.SUBMIT, handleLoginSubmit);
	yield takeLatest(types.LOGIN.REGISTER_REQUEST, handleRegisterRequest);
	yield takeLatest(types.LOGIN.REGISTER_SUBMIT, handleRegisterSubmit);
	yield takeLatest(types.LOGIN.REGISTER_SUCCESS, handleRegisterSuccess);
	yield takeLatest(types.LOGIN.REGISTER_INCOMPLETE, handleRegisterIncomplete);
	yield takeLatest(types.LOGIN.SET_USERNAME_SUBMIT, handleSetUsernameSubmit);
	yield takeLatest(types.LOGIN.SET_USERNAME_REQUEST, handleSetUsernameRequest);
	yield takeLatest(types.LOGOUT, handleLogout);
	yield takeLatest(types.FORGOT_PASSWORD.REQUEST, handleForgotPasswordRequest);
};
export default root;
