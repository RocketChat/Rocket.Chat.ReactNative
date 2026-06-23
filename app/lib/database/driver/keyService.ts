/**
 * Database key service — generates, stores, and retrieves per-database SQLCipher
 * key + salt material.
 *
 * Keys are 32-byte CSPRNG values, hex-encoded (64 hex chars). Salts are 16-byte CSPRNG
 * values, hex-encoded (32 hex chars). Neither may ever appear in logs, thrown errors,
 * or telemetry.
 *
 * The salt is stored externally because the DB runs with a plaintext header
 * (cipher_plaintext_header_size = 32, set in connection.ts so iOS recognises the
 * encrypted WAL file and grants the background idle-WAL exemption). With a plaintext
 * header SQLCipher no longer persists the salt in the file's first 16 bytes, so it must
 * be supplied at open time via PRAGMA cipher_salt. Losing the salt makes the DB
 * permanently unreadable — same blast radius as losing the key — so both are destroyed
 * together in deleteDatabaseKey.
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
import { logEvent, events } from '../../methods/helpers/log';

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
		logEvent(events.DB_KEY_READ_FAILURE, { category: 'shim_unavailable' });
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
const SALT_PREFIX = 'db_salt_v1:';

function storageKey(prefix: string, dbName: string): string {
	return `${prefix}${dbName}`;
}

// Per-storageKey in-flight map: serializes concurrent getOrCreate calls so only one
// CSPRNG + setItem round-trip runs even when callers race.
const _getOrCreateInflight = new Map<string, Promise<string>>();

/**
 * Generates or retrieves a hex material string for `storageKey`.
 * Validates both stored values (corrupt → throw) and generated values (bad bridge → throw).
 * Neither the stored value nor the generated value ever appears in thrown error messages.
 */
function getOrCreate(sk: string, byteLen: number, hexLen: number, label: string): Promise<string> {
	const inflight = _getOrCreateInflight.get(sk);
	if (inflight) return inflight;

	const promise = (async (): Promise<string> => {
		const existing = await _shim.getItem(sk);
		if (existing !== null) {
			// Re-validate the stored value — a corrupt entry must not reach SQLCipher.
			if (!new RegExp(`^[0-9a-fA-F]{${hexLen}}$`).test(existing)) {
				logEvent(events.DB_KEY_READ_FAILURE, { category: 'stored_corrupt', material: label });
				throw new Error(`stored ${label} corrupt`);
			}
			return existing;
		}

		// randomKey (not randomBytes): the mobile-crypto bridge encodes randomBytes as
		// BASE64 on both platforms, while randomKey returns hex (SecureRandom/SecRandomCopyBytes
		// + bytesToHex). The argument is the byte count.
		const hex = await randomKey(byteLen);
		if (!new RegExp(`^[0-9a-fA-F]{${hexLen}}$`).test(hex)) {
			// Sanitize error — do not include the value in the message.
			logEvent(events.DB_KEY_READ_FAILURE, { category: 'generation_failed', material: label });
			throw new Error(`${label} generation produced unexpected output; cannot open database safely`);
		}

		await _shim.setItem(sk, hex);
		return hex;
	})();

	_getOrCreateInflight.set(sk, promise);
	// Cleanup regardless of outcome. The .catch silences the secondary rejection on the
	// finally-chained promise — the real rejection propagates via `promise`.
	promise
		.finally(() => {
			_getOrCreateInflight.delete(sk);
		})
		.catch(() => {});

	return promise;
}

/**
 * Returns the hex key for `dbName`, generating and storing a fresh one if none exists.
 * Idempotent: repeated calls for the same name return the same key.
 *
 * The key is 32 bytes (256-bit) from the platform CSPRNG, hex-encoded to 64 chars.
 * It is never logged, never included in thrown errors, never sent to telemetry.
 */
export function getOrCreateDatabaseKey(dbName: string): Promise<string> {
	return getOrCreate(storageKey(KEY_PREFIX, dbName), 32, 64, 'key');
}

/**
 * Returns the hex salt for `dbName`, generating and storing a fresh one if none exists.
 * Idempotent: repeated calls for the same name return the same salt.
 *
 * 16 bytes (128-bit) from the platform CSPRNG, hex-encoded to 32 chars — the size
 * SQLCipher expects for cipher_salt. Never logged, thrown, or sent to telemetry.
 */
export function getOrCreateDatabaseSalt(dbName: string): Promise<string> {
	return getOrCreate(storageKey(SALT_PREFIX, dbName), 16, 32, 'salt');
}

/**
 * Deletes the stored key AND salt for `dbName`. Call this when the database file is being
 * permanently destroyed (e.g. server logout + database wipe), not during migration.
 * After calling this, the database file is permanently inaccessible.
 */
export async function deleteDatabaseKey(dbName: string): Promise<void> {
	await Promise.all([_shim.removeItem(storageKey(KEY_PREFIX, dbName)), _shim.removeItem(storageKey(SALT_PREFIX, dbName))]);
}
