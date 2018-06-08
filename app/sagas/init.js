import { AsyncStorage } from 'react-native';
import { call, put, takeLatest } from 'redux-saga/effects';

import * as actions from '../actions';
import { setServer } from '../actions/server';
import { restoreToken, setUser } from '../actions/login';
import { APP } from '../actions/actionsTypes';
import RocketChat from '../lib/rocketchat';
import log from '../utils/log';

const restore = function* restore() {
	try {
		const token = yield call([AsyncStorage, 'getItem'], RocketChat.TOKEN_KEY);
		if (token) {
			yield put(restoreToken(token));
		}

		const currentServer = yield call([AsyncStorage, 'getItem'], 'currentServer');
		if (currentServer) {
			yield put(setServer(currentServer));

			const login = yield call([AsyncStorage, 'getItem'], `${ RocketChat.TOKEN_KEY }-${ currentServer }`);
			if (login) {
				yield put(setUser(JSON.parse(login)));
			}
		}

		yield put(actions.appReady({}));
	} catch (e) {
		log('restore', e);
	}
};

const root = function* root() {
	yield takeLatest(APP.INIT, restore);
};
export default root;
