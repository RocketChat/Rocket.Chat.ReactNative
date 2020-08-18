import { takeLatest, select, put } from 'redux-saga/effects';

import { ENCRYPTION } from '../actions/actionsTypes';
import { encryptionSet } from '../actions/encryption';
import { Encryption } from '../lib/encryption';
import { getUserSelector } from '../selectors/login';
import database from '../lib/database';

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

	try {
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
