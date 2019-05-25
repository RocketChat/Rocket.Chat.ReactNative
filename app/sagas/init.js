// import { AsyncStorage } from 'react-native';
import { put, takeLatest, all } from 'redux-saga/effects';
import SplashScreen from 'react-native-splash-screen';

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
		const { serversDB } = database.databases;

		const currentServer = serversDB.objects('servers').filtered('currentServer = true');

		const { token, server } = yield all({
			token: currentServer.length === 0 ? null : currentServer[0].userToken,
			server: currentServer.length === 0 ? null : currentServer[0].id
		});

		const sortPreferences = yield RocketChat.getSortPreferences();
		yield put(setAllPreferences(sortPreferences));

		const useMarkdown = yield RocketChat.getUseMarkdown();
		yield put(toggleMarkdown(useMarkdown));

		if (!token || !server) {
			yield all([
				serversDB.write(() => {
					try {
						serversDB.create('servers', { id: server, currentServer: false, userToken: null }, true);
					} catch (e) {
						log('restore -> removeCurrentServer ->', e);
					}
				})
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
