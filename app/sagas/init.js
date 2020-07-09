import { put, takeLatest, all } from 'redux-saga/effects';
import RNUserDefaults from 'rn-user-defaults';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import RNBootSplash from 'react-native-bootsplash';
import AsyncStorage from '@react-native-community/async-storage';

import { selectServerRequest } from '../actions/server';
import { setAllPreferences } from '../actions/sortPreferences';
import { toggleCrashReport } from '../actions/crashReport';
import { APP } from '../actions/actionsTypes';
import RocketChat from '../lib/rocketchat';
import log from '../utils/log';
import {
	SERVERS, SERVER_ICON, SERVER_NAME, SERVER_URL, TOKEN, USER_ID
} from '../constants/userDefaults';
import { isIOS } from '../utils/deviceInfo';
import database from '../lib/database';
import protectedFunction from '../lib/methods/helpers/protectedFunction';
import { localAuthenticate } from '../utils/localAuthentication';
import { appStart, ROOT_OUTSIDE, appReady } from '../actions/app';

export const initLocalSettings = function* initLocalSettings() {
	const sortPreferences = yield RocketChat.getSortPreferences();
	yield put(setAllPreferences(sortPreferences));

	const allowCrashReport = yield RocketChat.getAllowCrashReport();
	yield put(toggleCrashReport(allowCrashReport));
};

const restore = function* restore() {
	try {
		let hasMigration;
		if (isIOS) {
			hasMigration = yield AsyncStorage.getItem('hasMigration');
		}

		let { token, server } = yield all({
			token: RNUserDefaults.get(RocketChat.TOKEN_KEY),
			server: RNUserDefaults.get('currentServer')
		});

		if (!hasMigration && isIOS) {
			let servers = yield RNUserDefaults.objectForKey(SERVERS);
			// if not have current
			if (servers && servers.length !== 0 && (!token || !server)) {
				server = servers[0][SERVER_URL];
				token = servers[0][TOKEN];
			}

			// get native credentials
			if (servers) {
				try {
					// parse servers
					servers = yield Promise.all(servers.map(async(s) => {
						await RNUserDefaults.set(`${ RocketChat.TOKEN_KEY }-${ s[SERVER_URL] }`, s[USER_ID]);
						return ({ id: s[SERVER_URL], name: s[SERVER_NAME], iconURL: s[SERVER_ICON] });
					}));
					const serversDB = database.servers;
					yield serversDB.action(async() => {
						const serversCollection = serversDB.collections.get('servers');
						const allServerRecords = await serversCollection.query().fetch();

						// filter servers
						let serversToCreate = servers.filter(i1 => !allServerRecords.find(i2 => i1.id === i2.id));

						// Create
						serversToCreate = serversToCreate.map(record => serversCollection.prepareCreate(protectedFunction((s) => {
							s._raw = sanitizedRaw({ id: record.id }, serversCollection.schema);
							Object.assign(s, record);
						})));

						const allRecords = serversToCreate;

						try {
							await serversDB.batch(...allRecords);
						} catch (e) {
							log(e);
						}
						return allRecords.length;
					});
				} catch (e) {
					log(e);
				}
			}

			try {
				yield AsyncStorage.setItem('hasMigration', '1');
			} catch (e) {
				log(e);
			}
		}

		if (!token || !server) {
			yield all([
				RNUserDefaults.clear(RocketChat.TOKEN_KEY),
				RNUserDefaults.clear('currentServer')
			]);
			yield put(appStart({ root: ROOT_OUTSIDE }));
		} else {
			const serversDB = database.servers;
			const serverCollections = serversDB.collections.get('servers');

			yield localAuthenticate(server);
			const serverObj = yield serverCollections.find(server);
			yield put(selectServerRequest(server, serverObj && serverObj.version));
		}

		yield put(appReady({}));
	} catch (e) {
		log(e);
		yield put(appStart({ root: ROOT_OUTSIDE }));
	}
};

const start = function start() {
	RNBootSplash.hide();
};

const root = function* root() {
	yield takeLatest(APP.INIT, restore);
	yield takeLatest(APP.START, start);
	yield takeLatest(APP.INIT_LOCAL_SETTINGS, initLocalSettings);
};
export default root;
