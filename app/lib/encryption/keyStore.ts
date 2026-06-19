import { randomKey } from '@rocket.chat/mobile-crypto';

import NativeDatabaseKeyStore from '../native/NativeDatabaseKeyStore';

const KEY_PREFIX = 'db_key_v1:';

function getNativeModule() {
	if (!NativeDatabaseKeyStore) {
		throw new Error('DatabaseKeyStore native module not found — ensure the module is linked and the app is rebuilt');
	}
	return NativeDatabaseKeyStore;
}

/**
 * Returns the stored 64-hex-char SQLCipher key for dbName, creating and persisting
 * a fresh one if none exists yet.
 *
 * Fail-closed: if getItem rejects (e.g. KEYCHAIN_READ_ERROR / KEYSTORE_READ_ERROR),
 * the error propagates — we never mint a new key on a read failure, which would
 * permanently lock an existing encrypted database.
 */
export async function getOrCreateDatabaseKey(dbName: string): Promise<string> {
	const native = getNativeModule();
	const storageKey = KEY_PREFIX + dbName;

	const existing = await native.getItem(storageKey);

	if (typeof existing === 'string') {
		return existing;
	}

	if (existing !== null) {
		// undefined or any unexpected value is a contract violation — never mint
		throw new Error(`DatabaseKeyStore.getItem returned unexpected value for key ${storageKey}`);
	}

	// True not-found (null) — mint a new 32-byte key as 64 hex chars
	const newKey = await randomKey(32);
	await native.setItem(storageKey, newKey);
	return newKey;
}
