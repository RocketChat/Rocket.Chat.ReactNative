import EJSON from 'ejson';
import RNUserDefaults from 'rn-user-defaults';
import { takeLatest, select, put } from 'redux-saga/effects';

import { ENCRYPTION } from '../actions/actionsTypes';
import { encryptionSetBanner } from '../actions/encryption';
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
import { getUserSelector } from '../selectors/login';
import { getServerSelector } from '../selectors/server';
import { showErrorAlert } from '../utils/info';
import I18n from '../i18n';

const handleEncryptionDecodeKey = function* handleEncryptionDecodeKey({ password }) {
	try {
		const server = yield select(getServerSelector);
		const user = yield select(getUserSelector);

		// Fetch server stored e2e keys, since we're not storing keys
		// to prevent cases where the user reset their keys
		const keys = yield RocketChat.e2eFetchMyKeys();

		const publicKey = EJSON.parse(keys.publicKey);
		// Decode the current server key
		const privateKey = yield Encryption.decodePrivateKey(keys.privateKey, password, user.id);

		// Load these decrypted keys
		yield Encryption.loadKeys(server, publicKey, privateKey);

		// Decrypt all pending messages/subscriptions
		yield Encryption.initialize();

		// Hide encryption banner
		yield put(encryptionSetBanner());

		Navigation.back();
	} catch {
		// Can't decrypt user private key
		showErrorAlert(I18n.t('Encryption_error_desc'), I18n.t('Encryption_error_title'));
	}
};

const handleEncryptionInit = function* handleEncryptionInit() {
	try {
		const server = yield select(getServerSelector);
		const user = yield select(getUserSelector);

		// Fetch server info to check E2E enable
		const serversDB = database.servers;
		const serversCollection = serversDB.collections.get('servers');
		const serverInfo = yield serversCollection.find(server);

		// If E2E is disabled on server don't start
		if (!serverInfo?.E2E_Enable) {
			return;
		}

		// Fetch stored e2e keys for this server
		const storedPublicKey = yield RNUserDefaults.get(`${ server }-${ E2E_PUBLIC_KEY }`);
		const storedPrivateKey = yield RNUserDefaults.get(`${ server }-${ E2E_PRIVATE_KEY }`);

		// Fetch server stored e2e keys
		const keys = yield RocketChat.e2eFetchMyKeys();

		// User doesn't have a private key stored
		// so, we'll use the server private key, but it needs the password
		// then the encryption client can't be started yet
		if (!storedPrivateKey && keys?.privateKey) {
			yield put(encryptionSetBanner(E2E_BANNER_TYPE.REQUEST_PASSWORD));
			return;
		}

		// If the user has a private key stored
		// but doesn't saved her random password yet
		const storedRandomPassword = yield RNUserDefaults.get(`${ server }-${ E2E_RANDOM_PASSWORD_KEY }`);
		if (storedRandomPassword) {
			yield put(encryptionSetBanner(E2E_BANNER_TYPE.SAVE_PASSWORD));
		}

		// If we don't have a public key stored use the server stored public key
		let publicKey = storedPublicKey || keys?.publicKey;
		if (publicKey) {
			publicKey = EJSON.parse(publicKey);
		}

		if (publicKey && storedPrivateKey) {
			// Start the Encryption client for this server
			yield Encryption.loadKeys(server, publicKey, storedPrivateKey);
		} else {
			// Create new keys since the user doesn't have any
			yield Encryption.createKeys(user.id, server);
			yield put(encryptionSetBanner(E2E_BANNER_TYPE.SAVE_PASSWORD));
		}

		// Decrypt all pending messages/subscriptions
		yield Encryption.initialize();
	} catch {
		// Do nothing
	}
};

const root = function* root() {
	yield takeLatest(ENCRYPTION.INIT, handleEncryptionInit);
	yield takeLatest(ENCRYPTION.DECODE_KEY, handleEncryptionDecodeKey);
};
export default root;
