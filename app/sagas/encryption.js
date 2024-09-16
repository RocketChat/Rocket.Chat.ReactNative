import EJSON from 'ejson';
import { put, select, takeLatest } from 'redux-saga/effects';

import { ENCRYPTION } from '../actions/actionsTypes';
import { encryptionDecodeKeyFailure, encryptionSet } from '../actions/encryption';
import { Encryption } from '../lib/encryption';
import database from '../lib/database';
import UserPreferences from '../lib/methods/userPreferences';
import { getUserSelector } from '../selectors/login';
import log from '../lib/methods/helpers/log';
import { E2E_BANNER_TYPE, E2E_PRIVATE_KEY, E2E_PUBLIC_KEY, E2E_RANDOM_PASSWORD_KEY } from '../lib/constants';
import { Services } from '../lib/services';

const getServer = state => state.server.server;
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
		const storedPrivateKey = UserPreferences.getString(`${server}-${E2E_PRIVATE_KEY}`);

		// Fetch server stored e2e keys
		const keys = yield Services.e2eFetchMyKeys();

		// A private key was received from the server, but it's not saved locally yet
		// Show the banner asking for the password
		if (!storedPrivateKey && keys?.privateKey) {
			yield put(encryptionSet(false, E2E_BANNER_TYPE.REQUEST_PASSWORD));
			return;
		}

		// Fetch stored public e2e key for this server
		let storedPublicKey = UserPreferences.getString(`${server}-${E2E_PUBLIC_KEY}`);

		// Prevent parse undefined
		if (storedPublicKey) {
			storedPublicKey = EJSON.parse(storedPublicKey);
		}

		if (storedPublicKey && storedPrivateKey) {
			// Persist these keys
			yield Encryption.persistKeys(server, storedPublicKey, storedPrivateKey);
		} else {
			// Create new keys since the user doesn't have any
			yield Encryption.createKeys(user.id, server);
		}

		// If the user has a private key stored, but never entered the password
		const storedRandomPassword = UserPreferences.getString(`${server}-${E2E_RANDOM_PASSWORD_KEY}`);

		if (storedRandomPassword) {
			yield put(encryptionSet(true, E2E_BANNER_TYPE.SAVE_PASSWORD));
		} else {
			yield put(encryptionSet(true));
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
		const keys = yield Services.e2eFetchMyKeys();

		const publicKey = EJSON.parse(keys?.publicKey);

		// Decode the current server key
		const privateKey = yield Encryption.decodePrivateKey(keys?.privateKey, password, user.id);

		// Persist these decrypted keys
		yield Encryption.persistKeys(server, publicKey, privateKey);

		// Decrypt all pending messages/subscriptions
		Encryption.initialize(user.id);

		// Hide encryption banner
		yield put(encryptionSet(true));
	} catch {
		// Can't decrypt user private key
		yield put(encryptionDecodeKeyFailure());
	}
};

const root = function* root() {
	yield takeLatest(ENCRYPTION.INIT, handleEncryptionInit);
	yield takeLatest(ENCRYPTION.STOP, handleEncryptionStop);
	yield takeLatest(ENCRYPTION.DECODE_KEY, handleEncryptionDecodeKey);
};
export default root;
