import { AsyncStorage } from 'react-native';
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
import {
	SERVERS, SERVER_ICON, SERVER_NAME, SERVER_URL, TOKEN, USER_ID
} from '../constants/userDefaults';
import { isIOS } from '../utils/deviceInfo';

const restore = function* restore() {
	try {
		let hasMigration;
		if (isIOS) {
			yield RNUserDefaults.setName('group.ios.chat.rocket');
			hasMigration = yield AsyncStorage.getItem('hasMigration');
		}

		let { token, server } = yield all({
			token: RNUserDefaults.get(RocketChat.TOKEN_KEY),
			server: RNUserDefaults.get('currentServer')
		});

		// get native credentials
		if (isIOS && !hasMigration) {
			const { serversDB } = database.databases;
			const servers = yield RNUserDefaults.objectForKey(SERVERS);
			if (servers) {
				serversDB.write(() => {
					servers.forEach(async(serverItem) => {
						const serverInfo = {
							id: serverItem[SERVER_URL],
							name: serverItem[SERVER_NAME],
							iconURL: serverItem[SERVER_ICON]
						};
						try {
							serversDB.create('servers', serverInfo, true);
							await RNUserDefaults.set(`${ RocketChat.TOKEN_KEY }-${ serverInfo.id }`, serverItem[USER_ID]);
						} catch (e) {
							log('err_create_servers', e);
						}
					});
				});
				yield AsyncStorage.setItem('hasMigration', '1');
			}

			// if not have current
			if (servers && servers.length !== 0 && (!token || !server)) {
				server = servers[0][SERVER_URL];
				token = servers[0][TOKEN];
			}
		}

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
