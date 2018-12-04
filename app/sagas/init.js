import { AsyncStorage } from 'react-native';
import { put, takeLatest, all } from 'redux-saga/effects';

import * as actions from '../actions';
import { selectServerRequest } from '../actions/server';
import { setAllPreferences } from '../actions/sortPreferences';
import { APP } from '../actions/actionsTypes';
import RocketChat from '../lib/rocketchat';
import log from '../utils/log';

const restore = function* restore() {
	try {
		const { token, server } = yield all({
			token: AsyncStorage.getItem(RocketChat.TOKEN_KEY),
			server: AsyncStorage.getItem('currentServer')
		});

		const sortPreferences = yield RocketChat.getSortPreferences();
		yield put(setAllPreferences(sortPreferences));

		if (!token || !server) {
			yield all([
				AsyncStorage.removeItem(RocketChat.TOKEN_KEY),
				AsyncStorage.removeItem('currentServer')
			]);
			yield put(actions.appStart('outside'));
		} else if (server) {
			yield put(selectServerRequest(server));
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
