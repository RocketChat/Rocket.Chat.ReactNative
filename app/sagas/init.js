import { call, put, select, takeLatest } from 'redux-saga/effects';
import RNBootSplash from 'react-native-bootsplash';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { CURRENT_SERVER, TOKEN_KEY } from '../lib/constants/keys';
import UserPreferences, { initializeStorage } from '../lib/methods/userPreferences';
import { selectServerRequest } from '../actions/server';
import { setAllPreferences } from '../actions/sortPreferences';
import { APP } from '../actions/actionsTypes';
import log from '../lib/methods/helpers/log';
import database from '../lib/database';
import { localAuthenticate } from '../lib/methods/helpers/localAuthentication';
import { appReady, appStart } from '../actions/app';
import { RootEnum } from '../definitions';
import { getSortPreferences } from '../lib/methods/userPreferencesMethods';
import { deepLinkingClickCallPush } from '../actions/deepLinking';
import { getServerById } from '../lib/database/services/Server';
import MMKVLogger from '../lib/native/NativeMMKVLogger';

export const initLocalSettings = function* initLocalSettings() {
	const sortPreferences = getSortPreferences();
	yield put(setAllPreferences(sortPreferences));
};

const restore = function* restore() {
	const isIOS = Platform.OS === 'ios';

	// Check if MMKVLogger is available (only after native build includes it)
	const hasNativeLogger = isIOS && MMKVLogger && typeof MMKVLogger.info === 'function';

	// Use native logger for TestFlight debugging on iOS when available
	const logger = {
		info: (msg) => {
			console.log(msg);
			if (hasNativeLogger) {
				try {
					MMKVLogger.info('AppInit', msg);
				} catch (e) {
					// Silent fail - native logger not critical
				}
			}
		},
		error: (msg) => {
			console.error(msg);
			if (hasNativeLogger) {
				try {
					MMKVLogger.error('AppInit', msg);
				} catch (e) {
					// Silent fail
				}
			}
		},
		warn: (msg) => {
			console.warn(msg);
			if (hasNativeLogger) {
				try {
					MMKVLogger.warning('AppInit', msg);
				} catch (e) {
					// Silent fail
				}
			}
		},
		debug: (msg, obj) => {
			if (obj) {
				const formatted = `${msg} ${JSON.stringify(obj, null, 2)}`;
				console.log(formatted);
				if (hasNativeLogger) {
					try {
						MMKVLogger.info('AppInit', formatted);
					} catch (e) {
						// Silent fail
					}
				}
			} else {
				console.log(msg);
				if (hasNativeLogger) {
					try {
						MMKVLogger.debug('AppInit', msg);
					} catch (e) {
						// Silent fail
					}
				}
			}
		}
	};

	logger.info('=== APP RESTORE START ===');

	try {
		// IMPORTANT: Initialize MMKV storage FIRST
		// Native migration has already completed in AppDelegate
		// This connects JavaScript to the migrated data
		logger.info('Initializing MMKV storage...');
		yield call(initializeStorage);
		logger.info('MMKV storage initialized');

		// Debug: Check migration status (useful for TestFlight debugging)
		if (isIOS) {
			try {
				const MMKVMigrationStatus = require('../lib/native/NativeMMKVMigrationStatus').default;
				if (MMKVMigrationStatus && typeof MMKVMigrationStatus.getMigrationStatus === 'function') {
					const status = yield call([MMKVMigrationStatus, MMKVMigrationStatus.getMigrationStatus]);
					logger.info('=== MIGRATION STATUS ===');
					logger.debug('Migration status', status);

					// Check storage health
					if (typeof MMKVMigrationStatus.checkStorageHealth === 'function') {
						const health = yield call([MMKVMigrationStatus, MMKVMigrationStatus.checkStorageHealth]);
						logger.info('=== STORAGE HEALTH ===');
						logger.debug('Storage health', health);

						if (health.isProblemState) {
							logger.warn('⚠️  STORAGE HEALTH WARNING:');
							logger.warn(`   ${health.recommendation}`);
							logger.warn('   This might explain why user is not logged in after update.');
						}
					}
				} else {
					logger.info('MMKVMigrationStatus not available (needs native rebuild)');
				}
			} catch (error) {
				const errorMsg = error && error.message ? error.message : String(error || 'Unknown');
				logger.error(`Could not get migration status: ${errorMsg}`);
			}
		}

		// Debug: Log STORAGE PATH and FILES (critical for TestFlight debugging)
		if (isIOS) {
			try {
				const { MMKVReader } = require('react-native').NativeModules;
				if (MMKVReader && typeof MMKVReader.getStoragePath === 'function') {
					logger.info('=== CHECKING MMKV STORAGE ===');
					const storagePath = yield call([MMKVReader, MMKVReader.getStoragePath]);
					logger.debug('Storage path', storagePath);

					const mmkvFiles = yield call([MMKVReader, MMKVReader.listMMKVFiles]);
					logger.info(`Found ${mmkvFiles.length} MMKV files`);
					logger.debug('MMKV files', mmkvFiles);
				} else {
					logger.info('MMKVReader not available (needs native rebuild)');
				}
			} catch (error) {
				const errorMsg = error && error.message ? error.message : String(error || 'Unknown');
				logger.error(`Could not get storage info: ${errorMsg}`);
			}
		}

		// Debug: Log all keys in storage
		const allKeys = UserPreferences.getAllKeys();
		logger.info('=== CURRENT STORAGE STATE ===');
		logger.info(`Total keys in MMKV: ${allKeys.length}`);
		if (allKeys.length > 0) {
			logger.debug('All keys', allKeys);

			// Log important keys and their values
			const importantKeys = allKeys.filter(
				key =>
					key.includes('CURRENT_SERVER') ||
					key.includes('reactnativemeteor_usertoken') ||
					key.includes('THEME') ||
					key.includes('SERVER')
			);
			logger.info(`Important keys found: ${importantKeys.length}`);
			importantKeys.forEach((key) => {
				const value = UserPreferences.getString(key);
				logger.info(`  ${key}: ${value}`);
			});
		} else {
			logger.warn('⚠️  NO KEYS FOUND IN STORAGE! User will need to login.');
		}

		const server = UserPreferences.getString(CURRENT_SERVER);
		logger.info('=== RESTORE LOGIC ===');
		logger.info(`Current server from storage: ${server || 'NONE'}`);
		let userId = UserPreferences.getString(`${TOKEN_KEY}-${server}`);

		if (!server) {
			logger.warn('No server found - starting with ROOT_OUTSIDE');
			yield put(appStart({ root: RootEnum.ROOT_OUTSIDE }));
		} else if (!userId) {
			logger.warn(`No userId found for server: ${server}`);
			logger.info('Checking other servers in database...');

			const serversDB = database.servers;
			const serversCollection = serversDB.get('servers');
			const servers = yield serversCollection.query().fetch();

			logger.info(`Found ${servers.length} servers in database`);

			// Check if there're other logged in servers and picks first one
			if (servers.length > 0) {
				for (let i = 0; i < servers.length; i += 1) {
					const newServer = servers[i].id;
					userId = UserPreferences.getString(`${TOKEN_KEY}-${newServer}`);
					logger.info(`Checking server ${i + 1}/${servers.length}: ${newServer} - token: ${userId ? 'FOUND' : 'NOT FOUND'}`);
					if (userId) {
						logger.info(`✅ Found valid server with token: ${newServer}`);
						return yield put(selectServerRequest(newServer, newServer.version));
					}
				}
			}
			logger.warn('No valid server with token found - starting with ROOT_OUTSIDE');
			yield put(appStart({ root: RootEnum.ROOT_OUTSIDE }));
		} else {
			logger.info(`✅ Valid server and userId found - server: ${server}`);
			try {
				yield localAuthenticate(server);
			} catch (error) {
				const errorMsg = error && error.message ? error.message : String(error || 'Unknown');
				logger.warn(`localAuthenticate failed: ${errorMsg}`);
			}
			const serverRecord = yield getServerById(server);
			if (!serverRecord) {
				logger.warn('Server record not found in database yet - proceeding without version info');
				return yield put(selectServerRequest(server));
			}
			logger.info('Selecting server and starting app...');
			yield put(selectServerRequest(server, serverRecord.version));
		}

		yield put(appReady({}));
		logger.info('App marked as ready');

		const pushNotification = yield call(AsyncStorage.getItem, 'pushNotification');
		if (pushNotification) {
			logger.info('Found pending push notification');
			yield call(AsyncStorage.removeItem, 'pushNotification');
			yield call(deepLinkingClickCallPush, JSON.parse(pushNotification));
		}

		logger.info('=== APP RESTORE COMPLETE ===');
	} catch (e) {
		const errorMsg = e && e.message ? e.message : String(e || 'Unknown error');
		logger.error(`Restore error: ${errorMsg}`);
		log(e);
		yield put(appStart({ root: RootEnum.ROOT_OUTSIDE }));
	}
};

const start = function* start() {
	const currentRoot = yield select(state => state.app.root);

	if (currentRoot !== RootEnum.ROOT_LOADING_SHARE_EXTENSION) {
		yield RNBootSplash.hide({ fade: true });
	}
};

const root = function* root() {
	yield takeLatest(APP.INIT, restore);
	yield takeLatest(APP.START, start);
	yield takeLatest(APP.INIT_LOCAL_SETTINGS, initLocalSettings);
};
export default root;
