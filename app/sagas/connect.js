import { call, takeLatest, select, take, race, put, all } from 'redux-saga/effects';
import { delay } from 'redux-saga';
import { AsyncStorage } from 'react-native';
import { METEOR } from '../actions/actionsTypes';
import RocketChat from '../lib/rocketchat';
import {
	loginRequest,
	loginSubmit,
	registerRequest,
	registerIncomplete,
	loginSuccess,
	loginFailure,
	logout,
	setToken,
	registerSuccess,
	setUsernameRequest,
	setUsernameSuccess,
	forgotPasswordSuccess,
	forgotPasswordFailure
} from '../actions/login';

const getServer = ({ server }) => server.server;
const getToken = function* getToken() {
	const currentServer = yield select(getServer);
	const user = yield call([AsyncStorage, 'getItem'], `${ RocketChat.TOKEN_KEY }-${ currentServer }`);
	if (user) {
		yield put(setToken(JSON.parse(user)));
		yield call([AsyncStorage, 'setItem'], RocketChat.TOKEN_KEY, JSON.parse(user).token || '');
		return JSON.parse(user);
	}
	return yield put(setToken());
};


const connect = (...args) => RocketChat.connect(...args);

const test = function* test() {
	try {
		const server = yield select(getServer);
		const user = yield call(getToken);
		// const response =
		yield all([call(connect, server, user && user.token ? { resume: user.token, ...user.user } : undefined)]);// , put(loginRequest({ resume: user.token }))]);
	// yield put(connectSuccess(response));
	} catch (err) {
		alert(err);
	// yield put(connectFailure(err.status));
	}
};

const root = function* root() {
	yield takeLatest(METEOR.REQUEST, test);
	// yield take(METEOR.SUCCESS, watchConnect);
	// yield takeLatest(METEOR.SUCCESS, watchConnect);
};
export default root;
