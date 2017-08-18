import { AsyncStorage } from 'react-native';
import { take, put, call, takeEvery, fork, select, all } from 'redux-saga/effects';
import * as types from '../actions/actionsTypes';
import { loginRequest, loginSuccess, loginFailure, setToken } from '../actions/login';
import RocketChat from '../lib/rocketchat';

const TOKEN_KEY = 'reactnativemeteor_usertoken';
const getUser = state => state.login.user;
const getServer = state => state.server;
const loginCall = args => (args.resume ? RocketChat.login(args) : RocketChat.loginWithPassword(args));

const getToken = function* getToken() {
	const currentServer = yield select(getServer);
	console.log('currentServer', currentServer);
	const token = yield call([AsyncStorage, 'getItem'], `${ TOKEN_KEY }-${ currentServer }`);
	console.log('currentServer TOKEN', token);
	if (token) { yield put(setToken(token)); }
	// yield call([AsyncStorage, 'setItem'], TOKEN_KEY, token || '');
	return token;
};

const sagaLogin = function* sagaLogin(payload) {
	try {
		const response = yield call(loginCall, payload);
		yield put(loginSuccess(response));
	} catch (err) {
		yield put(loginFailure(err));
	}
};
const watchLoginRequest = function* watchLoginRequest() {
	do {
		try {
			yield all([take(types.METEOR.SUCCESS), take(types.SERVER.CHANGED)]);
			const token = yield call(getToken);
			if (token) {
				yield put(loginRequest({ resume: token }));
			}
		} catch (e) {
			console.log(e);
		}
	} while (true);
};

const saveToken = function* saveToken() {
	const [server, user] = yield all([select(getServer), select(getUser)]);
	yield AsyncStorage.setItem(TOKEN_KEY, user.token);
	yield AsyncStorage.setItem(`${ TOKEN_KEY }-${ server }`, user.token);
};

const root = function* root() {
	yield fork(watchLoginRequest);
	yield takeEvery(types.LOGIN.REQUEST, sagaLogin);
	yield takeEvery(types.LOGIN.SUCCESS, saveToken);
};
export default root;
