import { AsyncStorage } from 'react-native';
import { put, takeLatest, all } from 'redux-saga/effects';
import SplashScreen from 'react-native-splash-screen';

import * as actions from '../actions';
import { selectServerRequest } from '../actions/server';
import { setAllPreferences } from '../actions/sortPreferences';
import { APP } from '../actions/actionsTypes';
import RocketChat from '../lib/rocketchat';
import log from '../utils/log';
import Navigation from '../lib/Navigation';
import database from '../lib/realm';

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
			const serverObj = database.databases.serversDB.objectForPrimaryKey('servers', server);
			yield put(selectServerRequest(server, serverObj && serverObj.version));
		}

		yield put(actions.appReady({}));
	} catch (e) {
		log('restore', e);
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
