import EJSON from 'ejson';
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
import UserPreferences from '../lib/userPreferences';
import { getUserSelector } from '../selectors/login';
import { showErrorAlert } from '../utils/info';
import I18n from '../i18n';
import log from '../utils/log';

const getServer = state => state.share.server.server || state.server.server;
const getE2eEnable = state => state.settings.E2E_Enable;

function* isServerE2EActivated(server) {
	const E2E_Enable = yield select(getE2eEnable);
	const serversDB = database.servers;
	const serversCollection = serversDB.collections.get('servers');

	let serverInfo;
	try {
		serverInfo = yield serversCollection.find(server);
	} catch {
		return false;
	}

	return !serverInfo?.E2E_Enable && !E2E_Enable;
}

function* showBannerToSaveLocalKey(storedServerE2EKey) {
	const allStoredServerE2EKeys = yield RocketChat.e2eFetchMyKeys();

	if (!storedServerE2EKey && allStoredServerE2EKeys?.privateKey) {
		yield put(encryptionSetBanner(E2E_BANNER_TYPE.REQUEST_PASSWORD));
	}
}

function* saveUserPassword(server) {
	const storedRandomPassword = yield UserPreferences.getStringAsync(`${ server }-${ E2E_RANDOM_PASSWORD_KEY }`);
	if (storedRandomPassword) {
		yield put(encryptionSetBanner(E2E_BANNER_TYPE.SAVE_PASSWORD));
	}
}

function* getPublicE2EServerKey(server) {
	const storedPublicKey = yield UserPreferences.getStringAsync(`${ server }-${ E2E_PUBLIC_KEY }`);
	if (storedPublicKey) {
		return EJSON.parse(storedPublicKey);
	}
}

function* createNewUserE2EKey(userId, server) {
	yield Encryption.createKeys(userId, server);
	yield put(encryptionSetBanner(E2E_BANNER_TYPE.SAVE_PASSWORD));
}

function decryptAllPendingSubscriptions(userId) {
	Encryption.initialize(userId);
}

const handleEncryptionInit = function* handleEncryptionInit() {
	try {
		const server = yield select(getServer);
		const user = yield select(getUserSelector);

		if (!isServerE2EActivated(server)) {
			return;
		}

		const storedServerE2EKey = yield UserPreferences.getStringAsync(`${ server }-${ E2E_PRIVATE_KEY }`);
		const storedPublicKey = getPublicE2EServerKey(server);

		showBannerToSaveLocalKey(storedServerE2EKey);
		saveUserPassword(server);

		if (storedPublicKey && storedServerE2EKey) {
			yield Encryption.persistKeys(server, storedPublicKey, storedServerE2EKey);
		} else {
			createNewUserE2EKey(user.id, server);
		}

		decryptAllPendingSubscriptions(user.id);
	} catch (e) {
		log(e);
	}
};

const handleEncryptionStop = function* handleEncryptionStop() {
	// Hide encryption banner
	yield put(encryptionSetBanner());
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
		yield put(encryptionSetBanner());

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
