import { AsyncStorage } from 'react-native';
import { call, put, takeLatest } from 'redux-saga/effects';

import * as actions from '../actions';
import { selectServerRequest } from '../actions/server';
import { restoreToken, setUser } from '../actions/login';
import { setAllPreferences } from '../actions/sortPreferences';
import { APP } from '../actions/actionsTypes';
import RocketChat from '../lib/rocketchat';
import log from '../utils/log';
import I18n from '../i18n';

const restore = function* restore() {
	try {
		const token = yield call([AsyncStorage, 'getItem'], RocketChat.TOKEN_KEY);
		if (token) {
			yield put(restoreToken(token));
		} else {
			yield put(actions.appStart('outside'));
		}

		const currentServer = yield call([AsyncStorage, 'getItem'], 'currentServer');
		if (currentServer) {
			yield put(selectServerRequest(currentServer));

			const user = yield call([AsyncStorage, 'getItem'], `${ RocketChat.TOKEN_KEY }-${ currentServer }`);
			if (user) {
				const userParsed = JSON.parse(user);
				if (userParsed.language) {
					I18n.locale = userParsed.language;
				}
				yield put(setUser(userParsed));
			}
		}

		const sortPreferences = yield RocketChat.getSortPreferences();
		yield put(setAllPreferences(sortPreferences));

		yield put(actions.appReady({}));
	} catch (e) {
		log('restore', e);
	}
};

const root = function* root() {
	yield takeLatest(APP.INIT, restore);
};
export default root;
