import EJSON from 'ejson';
import { takeLatest, select, put } from 'redux-saga/effects';

import { ENCRYPTION } from '../actions/actionsTypes';
import { encryptionSet } from '../actions/encryption';
import { Encryption } from '../lib/encryption';
import Navigation from '../lib/Navigation';
import {
	E2E_PUBLIC_KEY,
	E2E_PRIVATE_KEY,
	E2E_BANNER_TYPE,
	E2E_RANDOM_PASSWORD_KEY
} from '../lib/encryption/constants';
import database from '../lib/database';
import RocketChat from '../lib/rocketchat';
import UserPreferences from '../lib/userPreferences';
import { getUserSelector } from '../selectors/login';
import { showErrorAlert } from '../utils/info';
import I18n from '../i18n';
import log from '../utils/log';

const getServer = state => state.share.server.server || state.server.server;
const getE2eEnable = state => state.settings.E2E_Enable;

const handleEncryptionInit = function* handleEncryptionInit() {
	try {
		const server = yield select(getServer);
		const user = yield select(getUserSelector);
		const E2E_Enable = yield select(getE2eEnable);

		// Fetch server info to check E2E enable
		const serversDB = database.servers;
		const serversCollection = serversDB.get('servers');
		let serverInfo;
		try {
			serverInfo = yield serversCollection.find(server);
		} catch {
			// Server not found
		}

		// If E2E is disabled on server, skip
		if (!serverInfo?.E2E_Enable && !E2E_Enable) {
			return;
		}

		// Fetch stored private e2e key for this server
		const storedPrivateKey = yield UserPreferences.getStringAsync(`${ server }-${ E2E_PRIVATE_KEY }`);

		// Fetch server stored e2e keys
		const keys = yield RocketChat.e2eFetchMyKeys();

		// A private key was received from the server, but it's not saved locally yet
		// Show the banner asking for the password
		if (!storedPrivateKey && keys?.privateKey) {
			yield put(encryptionSet(false, E2E_BANNER_TYPE.REQUEST_PASSWORD));
			return;
		}

		// If the user has a private key stored, but never entered the password
		const storedRandomPassword = yield UserPreferences.getStringAsync(`${ server }-${ E2E_RANDOM_PASSWORD_KEY }`);
		if (storedRandomPassword) {
			yield put(encryptionSet(true, E2E_BANNER_TYPE.SAVE_PASSWORD));
		}

		// Fetch stored public e2e key for this server
		let storedPublicKey = yield UserPreferences.getStringAsync(`${ server }-${ E2E_PUBLIC_KEY }`);
		// Prevent parse undefined
		if (storedPublicKey) {
			storedPublicKey = EJSON.parse(storedPublicKey);
		}


		if (storedPublicKey && storedPrivateKey && !storedRandomPassword) {
			// Persist these keys
			yield Encryption.persistKeys(server, storedPublicKey, storedPrivateKey);
			yield put(encryptionSet(true));
		} else {
			// Create new keys since the user doesn't have any
			yield Encryption.createKeys(user.id, server);
			yield put(encryptionSet(true, E2E_BANNER_TYPE.SAVE_PASSWORD));
		}

		// Decrypt all pending messages/subscriptions
		Encryption.initialize(user.id);
	} catch (e) {
		log(e);
	}
};

const handleEncryptionStop = function* handleEncryptionStop() {
	// Hide encryption banner
	yield put(encryptionSet());
	// Stop Encryption client
	Encryption.stop();
};

const handleEncryptionDecodeKey = function* handleEncryptionDecodeKey({ password }) {
	try {
		const server = yield select(getServer);
		const user = yield select(getUserSelector);

		// Fetch server stored e2e keys
		const keys = yield RocketChat.e2eFetchMyKeys();

		const publicKey = EJSON.parse(keys?.publicKey);

		// Decode the current server key
		const privateKey = yield Encryption.decodePrivateKey(keys?.privateKey, password, user.id);

		// Persist these decrypted keys
		yield Encryption.persistKeys(server, publicKey, privateKey);

		// Decrypt all pending messages/subscriptions
		Encryption.initialize(user.id);

		// Hide encryption banner
		yield put(encryptionSet(true));

		Navigation.back();
	} catch {
		// Can't decrypt user private key
		showErrorAlert(I18n.t('Encryption_error_desc'), I18n.t('Encryption_error_title'));
	}
};

const root = function* root() {
	yield takeLatest(ENCRYPTION.INIT, handleEncryptionInit);
	yield takeLatest(ENCRYPTION.STOP, handleEncryptionStop);
	yield takeLatest(ENCRYPTION.DECODE_KEY, handleEncryptionDecodeKey);
};
export default root;
