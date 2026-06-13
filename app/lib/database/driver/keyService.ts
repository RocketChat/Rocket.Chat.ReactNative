/**
 * Database key service — generates, stores, and retrieves per-database SQLCipher keys.
 *
 * Keys are 32-byte CSPRNG values, hex-encoded (64 hex chars). They must never appear
 * in logs, thrown errors, or telemetry.
 *
 * Persistence goes through the IKeychainShim interface. The real backend lands with
 * the native-readers work and must satisfy:
 *   iOS     — kSecClassGenericPassword, kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly,
 *             kSecAttrSynchronizable = false, access group S6UPZG7ZR3.chat.rocket.reactnative
 *             (full team-prefixed form; the bare suffix fails with errSecMissingEntitlement)
 *   Android — Keystore-backed storage (hardware-backed where available)
 * MMKV is forbidden as the backing store.
 */

import { randomKey } from '@rocket.chat/mobile-crypto';

// ---------------------------------------------------------------------------
// Keychain shim — replaced via installKeychainShim by the real native binding
// ---------------------------------------------------------------------------

export interface IKeychainShim {
	getItem(key: string): Promise<string | null>;
	setItem(key: string, value: string): Promise<void>;
	removeItem(key: string): Promise<void>;
}

// Dev-only in-memory stand-in. Keys are lost on process restart, so a DB created
// against this shim becomes permanently unreadable — outside dev that is silent
// data loss, hence the loud failure.
const _devStore = new Map<string, string>();

function assertDevShimAllowed(): void {
	if (!__DEV__) {
		throw new Error('keychain shim not installed — call installKeychainShim before opening databases');
	}
}

const _devShim: IKeychainShim = {
	getItem: (key: string) => {
		assertDevShimAllowed();
		return Promise.resolve(_devStore.get(key) ?? null);
	},
	setItem: (key: string, value: string) => {
		assertDevShimAllowed();
		_devStore.set(key, value);
		return Promise.resolve();
	},
	removeItem: (key: string) => {
		assertDevShimAllowed();
		_devStore.delete(key);
		return Promise.resolve();
	}
};

let _shim: IKeychainShim = _devShim;

/**
 * Swap the keychain shim. Call this once at app startup from the native bridge
 * integration before any database is opened.
 */
export function installKeychainShim(shim: IKeychainShim): void {
	_shim = shim;
}

// ---------------------------------------------------------------------------
// Key service
// ---------------------------------------------------------------------------

const KEY_PREFIX = 'db_key_v1:';

function storageKey(dbName: string): string {
	return `${KEY_PREFIX}${dbName}`;
}

/**
 * Returns the hex key for `dbName`, generating and storing a fresh one if none exists.
 * Idempotent: repeated calls for the same name return the same key.
 *
 * The key is 32 bytes (256-bit) from the platform CSPRNG, hex-encoded to 64 chars.
 * It is never logged, never included in thrown errors, never sent to telemetry.
 */
export async function getOrCreateDatabaseKey(dbName: string): Promise<string> {
	const k = storageKey(dbName);
	const existing = await _shim.getItem(k);
	if (existing !== null) {
		return existing;
	}

	// randomKey (not randomBytes): the mobile-crypto bridge encodes randomBytes as
	// BASE64 on both platforms, while randomKey returns hex (SecureRandom/SecRandomCopyBytes
	// + bytesToHex). The argument is the byte count: 32 bytes → 64 hex chars.
	const hex = await randomKey(32);
	// Guard the bridge contract: anything but 64 hex chars must not be used as a key
	if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
		// Sanitize error — do not include the value in the message
		throw new Error('key generation produced unexpected output; cannot open database safely');
	}

	await _shim.setItem(k, hex);
	return hex;
}

/**
 * Deletes the stored key for `dbName`. Call this when the database file is being
 * permanently destroyed (e.g. server logout + database wipe), not during migration.
 * After calling this, the database file is permanently inaccessible.
 */
export async function deleteDatabaseKey(dbName: string): Promise<void> {
	await _shim.removeItem(storageKey(dbName));
}
