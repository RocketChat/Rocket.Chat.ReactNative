import {
	call, takeLatest, select, put
} from 'redux-saga/effects';
import { AsyncStorage } from 'react-native';
import { METEOR } from '../actions/actionsTypes';
import RocketChat from '../lib/rocketchat';
import { setToken } from '../actions/login';

const getServer = state => state.server.server;
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

const handleMeteorRequest = function* handleMeteorRequest() {
	try {
		const server = yield select(getServer);
		const user = yield AsyncStorage.getItem(`${ RocketChat.TOKEN_KEY }-${ server }`);
		let parsedUser;
		if (user) {
			parsedUser = JSON.parse(user);
			console.log("​handleMeteorRequest -> parsedUser", parsedUser);
			if (parsedUser.token) {
				yield AsyncStorage.setItem(RocketChat.TOKEN_KEY, parsedUser.token);
			}
		}
		// const user = yield call(getToken);
		yield call(connect, server, parsedUser && parsedUser.token ? { resume: parsedUser.token } : null);
		// yield call(connect, server);
	} catch (err) {
		console.warn('handleMeteorRequest', err);
	}
};

const root = function* root() {
	yield takeLatest(METEOR.REQUEST, handleMeteorRequest);
};
export default root;
