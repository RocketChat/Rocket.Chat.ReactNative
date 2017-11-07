import { AsyncStorage } from 'react-native';
import { take, put, call, takeEvery, takeLatest, select, all } from 'redux-saga/effects';
import * as types from '../actions/actionsTypes';
import {
	loginRequest,
	loginSubmit,
	registerRequest,
	loginSuccess,
	loginFailure,
	setToken,
	logout,
	registerSuccess,
	setUsernameRequest,
	setUsernameSuccess
} from '../actions/login';
import RocketChat from '../lib/rocketchat';

const TOKEN_KEY = 'reactnativemeteor_usertoken';
const getUser = state => state.login;
const getServer = state => state.server.server;
const loginCall = args => (args.resume ? RocketChat.login(args) : RocketChat.loginWithPassword(args));
const registerCall = args => RocketChat.register(args);
const setUsernameCall = args => RocketChat.setUsername(args);
const logoutCall = args => RocketChat.logout(args);

const getToken = function* getToken() {
	const currentServer = yield select(getServer);
	const user = yield call([AsyncStorage, 'getItem'], `${ TOKEN_KEY }-${ currentServer }`);
	if (user) {
		try {
			yield put(setToken(JSON.parse(user)));
			yield call([AsyncStorage, 'setItem'], TOKEN_KEY, JSON.parse(user).token || '');
			return JSON.parse(user);
		} catch (e) {
			console.log('getTokenerr', e);
		}
	} else {
		yield put(setToken());
	}
};

const handleLoginWhenServerChanges = function* handleLoginWhenServerChanges() {
	// do {
	try {
		yield take(types.METEOR.SUCCESS);
		yield call(getToken);
		// const { navigator } = yield select(state => state);

		const user = yield select(getUser);
		if (user.token) {
			yield put(loginRequest({ resume: user.token }));
			// console.log('AEEEEEEEEOOOOO');
			// // wait for a response
			// const { error } = yield race({
			// 	success: take(types.LOGIN.SUCCESS),
			// 	error: take(types.LOGIN.FAILURE)
			// });
			// console.log('AEEEEEEEEOOOOO', error);
			// if (!error) {
			// 	navigator.resetTo({
			// 		screen: 'Rooms'
			// 	});
			// }
		}
		// navigator.resetTo({
		// 	screen: 'Rooms'
		// });
	} catch (e) {
		console.log(e);
	}
	// } while (true);
};

const saveToken = function* saveToken() {
	const [server, user] = yield all([select(getServer), select(getUser)]);
	yield AsyncStorage.setItem(TOKEN_KEY, user.token);
	yield AsyncStorage.setItem(`${ TOKEN_KEY }-${ server }`, JSON.stringify(user));
};

const handleLoginRequest = function* handleLoginRequest({ credentials }) {
	try {
		const response = yield call(loginCall, credentials);
		yield put(loginSuccess(response));
	} catch (err) {
		if (err.error === 403) {
			yield put(logout());
		} else {
			yield put(loginFailure(err));
		}
	}
};

const handleLoginSubmit = function* handleLoginSubmit({ credentials }) {
	yield put(loginRequest(credentials));
};

const handleRegisterSubmit = function* handleRegisterSubmit({ credentials }) {
	// put a login request
	yield put(registerRequest(credentials));
	// wait for a response
	// yield race({
	// 	success: take(types.LOGIN.REGISTER_SUCCESS),
	// 	error: take(types.LOGIN.FAILURE)
	// });
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
	yield call(logoutCall, { server });
};

const root = function* root() {
	yield takeEvery(types.SERVER.CHANGED, handleLoginWhenServerChanges);
	yield takeLatest(types.LOGIN.REQUEST, handleLoginRequest);
	yield takeLatest(types.LOGIN.SUCCESS, saveToken);
	yield takeLatest(types.LOGIN.SUBMIT, handleLoginSubmit);
	yield takeLatest(types.LOGIN.REGISTER_REQUEST, handleRegisterRequest);
	yield takeLatest(types.LOGIN.REGISTER_SUBMIT, handleRegisterSubmit);
	yield takeLatest(types.LOGIN.REGISTER_SUCCESS, handleRegisterSuccess);
	yield takeLatest(types.LOGIN.SET_USERNAME_SUBMIT, handleSetUsernameSubmit);
	yield takeLatest(types.LOGIN.SET_USERNAME_REQUEST, handleSetUsernameRequest);
	yield takeLatest(types.LOGOUT, handleLogout);
};
export default root;
