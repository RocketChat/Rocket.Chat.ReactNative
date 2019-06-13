import { put, takeLatest, all } from 'redux-saga/effects';
import SplashScreen from 'react-native-splash-screen';
import RNUserDefaults from 'rn-user-defaults';

import * as actions from '../actions';
import { selectServerRequest } from '../actions/server';
import { setAllPreferences } from '../actions/sortPreferences';
import { toggleMarkdown } from '../actions/markdown';
import { APP } from '../actions/actionsTypes';
import RocketChat from '../lib/rocketchat';
import log from '../utils/log';
import Navigation from '../lib/Navigation';
import database from '../lib/realm';

const restore = function* restore() {
	try {
		const { token, server } = yield all({
			token: RNUserDefaults.get(RocketChat.TOKEN_KEY),
			server: RNUserDefaults.get('currentServer')
		});

		const sortPreferences = yield RocketChat.getSortPreferences();
		yield put(setAllPreferences(sortPreferences));

		const useMarkdown = yield RocketChat.getUseMarkdown();
		yield put(toggleMarkdown(useMarkdown));

		if (!token || !server) {
			yield all([
				RNUserDefaults.clear(RocketChat.TOKEN_KEY),
				RNUserDefaults.clear('currentServer')
			]);
			yield put(actions.appStart('outside'));
		} else if (server) {
			const serverObj = database.databases.serversDB.objectForPrimaryKey('servers', server);
			yield put(selectServerRequest(server, serverObj && serverObj.version));
		}

		yield put(actions.appReady({}));
	} catch (e) {
		log('err_restore', e);
	}
};

const start = function* start({ root }) {
	if (root === 'inside') {
		yield Navigation.navigate('InsideStack');
	} else if (root === 'setUsername') {
		yield Navigation.navigate('SetUsernameView');
	} else if (root === 'outside') {
		yield Navigation.navigate('OutsideStack');
	}
	SplashScreen.hide();
};

const root = function* root() {
	yield takeLatest(APP.INIT, restore);
	yield takeLatest(APP.START, start);
};
export default root;
