import RNUserDefaults from 'rn-user-defaults';
import { takeLatest, select, put } from 'redux-saga/effects';

import { ENCRYPTION } from '../actions/actionsTypes';
import {
	encryptionSet,
	encryptionSetBanner
} from '../actions/encryption';
import { Encryption } from '../lib/encryption';
import { getUserSelector } from '../selectors/login';
import {
	E2E_BANNER_TYPE,
	E2E_PRIVATE_KEY,
	E2E_RANDOM_PASSWORD_KEY
} from '../lib/encryption/constants';
import database from '../lib/database';
import RocketChat from '../lib/rocketchat';

const serverSelector = state => state.share.server || state.server.server;

const handleEncryptionInit = function* handleEncryptionInit() {
	try {
		const serversDB = database.servers;
		const serversCollection = serversDB.collections.get('servers');
		const server = yield select(serverSelector);
		const serverInfo = yield serversCollection.find(server);

		yield put(encryptionSet(serverInfo.E2E_Enable));
	} catch {
		// Server not found
	}
};

const handleEncryptionSet = function* handleEncryptionSet({ enabled }) {
	if (!enabled) {
		return;
	}

	const server = yield select(serverSelector);
	const user = yield select(getUserSelector);

	const storedPrivateKey = yield RNUserDefaults.get(`${ server }-${ E2E_PRIVATE_KEY }`);
	const { privateKey } = yield RocketChat.e2eFetchMyKeys();

	// User doesn't have a private key stored
	// so, we'll use the server private key, but it needs the password
	// then the encryption client can't be started yet
	if (!storedPrivateKey && privateKey) {
		yield put(encryptionSetBanner(E2E_BANNER_TYPE.REQUEST_PASSWORD));
		return;
	}

	// If the user has a private key stored
	// but doesn't saved her random password yet
	const storedRandomPassword = yield RNUserDefaults.get(`${ server }-${ E2E_RANDOM_PASSWORD_KEY }`);
	if (storedRandomPassword) {
		yield put(encryptionSetBanner(E2E_BANNER_TYPE.SAVE_PASSWORD));
	}

	try {
		// Start the Encryption client for this server
		yield Encryption.start(server, user.id);
	} catch {
		// Do nothing
	}
};

const root = function* root() {
	yield takeLatest(ENCRYPTION.INIT, handleEncryptionInit);
	yield takeLatest(ENCRYPTION.SET, handleEncryptionSet);
};
export default root;
