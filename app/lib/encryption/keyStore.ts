import { randomKey } from '@rocket.chat/mobile-crypto';

import NativeDatabaseKeyStore from '../native/NativeDatabaseKeyStore';

const KEY_PREFIX = 'db_key_v1:';
const DATABASE_KEY_PATTERN = /^[0-9a-f]{64}$/i;

/**
 * Returns the stored 64-hex-char SQLCipher key for dbName, creating and persisting
 * a fresh one if none exists yet.
 *
 * Fail-closed: a read rejection propagates (we never mint over a read failure), and a
 * stored value that isn't a 64-hex-char key is rejected rather than handed to SQLCipher —
 * either case would otherwise risk locking or corrupting an existing encrypted database.
 */
export async function getOrCreateDatabaseKey(dbName: string): Promise<string> {
	const storageKey = KEY_PREFIX + dbName;

	const existing = await NativeDatabaseKeyStore.getItem(storageKey);

	if (typeof existing === 'string') {
		if (!DATABASE_KEY_PATTERN.test(existing)) {
			throw new Error(`DatabaseKeyStore returned a malformed key for ${storageKey}`);
		}
		return existing;
	}

	if (existing !== null) {
		// undefined or any unexpected value is a contract violation — never mint
		throw new Error(`DatabaseKeyStore.getItem returned unexpected value for key ${storageKey}`);
	}

	// True not-found (null) — mint a new 32-byte key as 64 hex chars
	const newKey = await randomKey(32);
	if (!DATABASE_KEY_PATTERN.test(newKey)) {
		throw new Error(`Generated a malformed database key for ${storageKey}`);
	}
	await NativeDatabaseKeyStore.setItem(storageKey, newKey);
	return newKey;
}
