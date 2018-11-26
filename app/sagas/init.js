import { AsyncStorage } from 'react-native';
import { put, takeLatest, all } from 'redux-saga/effects';

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
		const { token, server } = yield all({
			token: AsyncStorage.getItem(RocketChat.TOKEN_KEY),
			server: AsyncStorage.getItem('currentServer')
		});

		if (!token || !server) {
			yield put(actions.appStart('outside'));
			yield RocketChat.clearAsyncStorage();
			return yield put(actions.appReady({}));
		}

		yield put(selectServerRequest(server));

		// const userStringified = yield AsyncStorage.getItem(`${ RocketChat.TOKEN_KEY }-${ server }`);
		// if (userStringified) {
		// 	const user = JSON.parse(userStringified);
		// 	yield put(restoreToken(token));
		// 	// yield put(setUser(JSON.parse(user)));
		// 	yield put(actions.appStart('inside'));
		// 	yield put(selectServerRequest(server));
		// 	// RocketChat.start({ server, token, user });
		// 	// const sortPreferences = yield RocketChat.getSortPreferences();
		// 	// yield put(setAllPreferences(sortPreferences));
		// } else {
		// 	yield put(actions.appStart('outside'));
		// 	yield RocketChat.clearAsyncStorage(server);
		// }

		yield put(actions.appReady({}));
	} catch (e) {
		alert(e)
		// log('restore', e);
	}
};

const root = function* root() {
	yield takeLatest(APP.INIT, restore);
};
export default root;
