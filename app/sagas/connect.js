import {
	call, takeLatest, select, put
} from 'redux-saga/effects';
import { AsyncStorage } from 'react-native';
import { METEOR } from '../actions/actionsTypes';
import RocketChat from '../lib/rocketchat';
import { setToken } from '../actions/login';

const getServer = ({ server }) => server.server;
const getToken = function* getToken() {
	const currentServer = yield select(getServer);
	const user = yield call([AsyncStorage, 'getItem'], `${ RocketChat.TOKEN_KEY }-${ currentServer }`);
	if (user) {
		yield put(setToken(JSON.parse(user)));
		try {
			yield call([AsyncStorage, 'setItem'], RocketChat.TOKEN_KEY, JSON.parse(user).token || '');
		} catch (error) {
			console.warn('getToken', error);
		}
		return JSON.parse(user);
	}

	yield AsyncStorage.removeItem(RocketChat.TOKEN_KEY);
	yield put(setToken());
	return null;
};


const connect = (...args) => RocketChat.connect(...args);

const test = function* test() {
	try {
		const server = yield select(getServer);
		const user = yield call(getToken);
		// const response =
		// yield all([call(connect, server, user && user.token ? { resume: user.token, ...user.user } : undefined)]);// , put(loginRequest({ resume: user.token }))]);
		yield call(connect, server, user && user.token ? { resume: user.token, ...user.user } : undefined);
	// yield put(connectSuccess(response));
	} catch (err) {
		console.warn('test', err);
	// yield put(connectFailure(err.status));
	}
};

const root = function* root() {
	yield takeLatest(METEOR.REQUEST, test);
	// yield take(METEOR.SUCCESS, watchConnect);
	// yield takeLatest(METEOR.SUCCESS, watchConnect);
};
export default root;
