/**
 * Database connection lifecycle — open, key, configure, wrap with Drizzle, close.
 *
 * Files outside app/lib/database/driver/ must not import expo-sqlite.
 *
 * Open sequence (non-negotiable invariants):
 *   1. openDatabaseAsync → raw SQLiteDatabase handle
 *   2. PRAGMA key = "x'<64-hex>'"  ← must be the FIRST statement; SQLCipher
 *      requires this before any schema access or the file is opened unencrypted
 *      and subsequent reads produce garbage or "not a database" errors.
 *   3. PRAGMA cipher_plaintext_header_size = 32  ← exposes a 32-byte plaintext header so
 *      iOS recognises the WAL SQLite magic and grants the background idle-WAL exemption.
 *      Default SQLCipher encrypts the header; iOS then cannot identify the suspended app's
 *      WAL file and kills it for holding a file lock (RUNNINGBOARD 0xdead10cc). The 32 bytes
 *      are header metadata (version/page-size) — no row data — so this is not a security
 *      regression. Must follow PRAGMA key, precede any other statement.
 *   4. PRAGMA cipher_salt = "x'<32-hex>'"  ← with a plaintext header SQLCipher no longer
 *      stores the salt in the file; it is supplied from the keychain (see keyService).
 *   5. PRAGMA busy_timeout = 500  ← mandatory; without it, concurrent access from
 *      the notification service extension causes SQLITE_BUSY starvation (multi-process
 *      WAL spike: 100% failure rate without it, 100% success with it)
 *   6. PRAGMA journal_mode = WAL
 *   7. Verify encryption with a trivial read (sqlite_master count) before handing out handle
 *   8. drizzle() wraps the raw handle with the appropriate schema
 *
 * Raw-key form: PRAGMA key = "x'<64-hex>'" — the x'...' quoting tells SQLCipher
 * to treat the value as raw bytes and skip the PBKDF2 key derivation step. This
 * is required because our keys come from the CSPRNG (already full-entropy); running
 * PBKDF2 on top would add cost with zero security benefit, and the Android native
 * reader spike proved the byte[] overload of SQLiteDatabase.openDatabase silently
 * PBKDF2-derives (causing "file is not a database" error) — both sides must use the
 * same raw-hex string form.
 */

import { Platform } from 'react-native';
import { openDatabaseAsync, deleteDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import { drizzle, type ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { Paths } from 'expo-file-system';

import * as appSchema from './schema/app';
import * as serversSchema from './schema/servers';
import { getOrCreateDatabaseKey, getOrCreateDatabaseSalt } from './keyService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AppDbKind = 'app';
export type ServersDbKind = 'servers';
export type DbKind = AppDbKind | ServersDbKind;

type SchemaForKind<K extends DbKind> = K extends 'servers' ? typeof serversSchema : typeof appSchema;

export interface DbHandle<K extends DbKind = DbKind> {
	/** Drizzle-wrapped handle for query/mutation work */
	db: ExpoSQLiteDatabase<SchemaForKind<K>>;
	/** Raw expo-sqlite handle, needed for addDatabaseChangeListener and direct PRAGMAs */
	sqlite: SQLiteDatabase;
	/** Derived DB file name (single .db suffix, no path) */
	dbName: string;
}

// ---------------------------------------------------------------------------
// Name derivation — mirrors the legacy WMDB path but with a single .db suffix
// ---------------------------------------------------------------------------

const APP_GROUP_ID = 'group.ios.chat.rocket';

/** The single servers/global DB name (no server URL involved). */
export const DEFAULT_DB_NAME = 'default.db';

/**
 * Derives the per-server database filename from the server URL.
 * Strips scheme, replaces slashes with dots, appends a single `.db`.
 * Matches the legacy `getDatabasePath` logic in `app/lib/database/index.ts`
 * but deliberately drops the `.db.db` double-suffix (wipe-and-restore recreates all files).
 */
export function deriveServerDbName(serverUrl: string): string {
	const sanitized = serverUrl
		.replace(/\/+$/, '')
		.replace(/(^\w+:|^)\/\//, '')
		.replace(/\//g, '_');
	return `${sanitized}.db`;
}

// ---------------------------------------------------------------------------
// App Group directory resolution
// ---------------------------------------------------------------------------

/**
 * Returns the iOS App Group container URI for database placement.
 * Falls back to undefined (expo-sqlite default dir) when:
 *   - running on Android
 *   - the container is unavailable (simulator builds without entitlement, unit tests)
 * A warning is logged on fallback; this never crashes.
 */
function resolveDbDirectory(): string | undefined {
	if (Platform.OS !== 'ios') {
		return undefined;
	}
	try {
		const containers = Paths.appleSharedContainers as Record<string, { uri: string } | undefined>;
		const container = containers[APP_GROUP_ID];
		if (!container?.uri) {
			console.warn(
				`[db/connection] App Group container '${APP_GROUP_ID}' not found — falling back to default SQLite directory. ` +
					'Ensure the entitlement is configured for production builds.'
			);
			return undefined;
		}
		// uri may have a trailing slash; expo-sqlite wants a directory path
		return container.uri.replace(/\/$/, '');
	} catch (e) {
		console.warn(
			'[db/connection] Failed to resolve App Group path:',
			(e as Error).message,
			'— falling back to default directory'
		);
		return undefined;
	}
}

// Resolved once at module load; the container path is stable for the process lifetime.
const DB_DIRECTORY = resolveDbDirectory();

// ---------------------------------------------------------------------------
// Handle registry — prevents opening the same file twice
// ---------------------------------------------------------------------------

const _registry = new Map<string, DbHandle>();
// Coalesces concurrent opens for the same dbName so only one openDatabaseAsync call runs.
const _inflight = new Map<string, Promise<DbHandle<any>>>();

// ---------------------------------------------------------------------------
// Open
// ---------------------------------------------------------------------------

async function applyOpenPragmas(sqlite: SQLiteDatabase, keyHex: string, saltHex: string): Promise<void> {
	// Key MUST be the first statement; then plaintext header (0xdead10cc exemption),
	// salt supply, busy timeout, and WAL mode — all in one round-trip.
	// Raw-key form: x'...' tells SQLCipher to skip PBKDF2.
	await sqlite.execAsync(
		`PRAGMA key = "x'${keyHex}'";` +
			'PRAGMA cipher_plaintext_header_size = 32;' +
			`PRAGMA cipher_salt = "x'${saltHex}'";` +
			'PRAGMA busy_timeout = 500;' +
			'PRAGMA journal_mode = WAL;'
	);

	// Verify encryption is working — a trivial read on an unkeyed SQLCipher file
	// throws "file is not a database"; surface a safe error with no key material.
	try {
		await sqlite.getFirstAsync('SELECT count(*) FROM sqlite_master;');
	} catch {
		// Do not include keyHex or the raw error (which may echo the PRAGMA) in the thrown message
		throw new Error('database open-verify failed — key may be wrong or file corrupt');
	}
}

/**
 * Opens a database for the given `dbName`, applies the full open sequence
 * (key → busy_timeout → WAL → verify), wraps with Drizzle, and registers the handle.
 * Returns the same handle on repeated calls for the same name.
 * Concurrent calls for the same name coalesce into a single open; a failed open
 * closes the raw handle to prevent a file-descriptor leak.
 */
function openDb<K extends DbKind>(dbName: string, kind: K): Promise<DbHandle<K>> {
	const cached = _registry.get(dbName);
	if (cached) {
		return Promise.resolve(cached as DbHandle<K>);
	}

	const inflight = _inflight.get(dbName);
	if (inflight) {
		return inflight as Promise<DbHandle<K>>;
	}

	const promise = (async (): Promise<DbHandle<K>> => {
		const [keyHex, saltHex] = await Promise.all([getOrCreateDatabaseKey(dbName), getOrCreateDatabaseSalt(dbName)]);

		const sqlite = await openDatabaseAsync(dbName, { enableChangeListener: true }, DB_DIRECTORY);

		try {
			await applyOpenPragmas(sqlite, keyHex, saltHex);
		} catch (err) {
			await sqlite.closeAsync().catch(() => {});
			throw err;
		}

		const schema = kind === 'servers' ? serversSchema : appSchema;
		// The conditional type SchemaForKind<K> cannot be narrowed by the JS runtime check above;
		// casting through unknown is the standard TS pattern for this shape.
		const db = drizzle(sqlite, { schema }) as unknown as ExpoSQLiteDatabase<SchemaForKind<K>>;

		const handle: DbHandle<K> = { db, sqlite, dbName };
		_registry.set(dbName, handle as DbHandle);
		return handle;
	})();

	_inflight.set(dbName, promise);
	// Cleanup inflight entry regardless of outcome. The .catch here silences the secondary
	// rejection on the finally-chained promise — the real rejection propagates via `promise`.
	promise
		.finally(() => {
			_inflight.delete(dbName);
		})
		.catch(() => {});

	return promise as Promise<DbHandle<K>>;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Opens (or returns the cached handle for) the global servers database.
 */
export function openServersDb(): Promise<DbHandle<'servers'>> {
	return openDb(DEFAULT_DB_NAME, 'servers');
}

/**
 * Opens (or returns the cached handle for) the per-server app database.
 * @param serverUrl  The full server URL, e.g. "https://open.rocket.chat"
 */
export function openServerDb(serverUrl: string): Promise<DbHandle<'app'>> {
	const dbName = deriveServerDbName(serverUrl);
	return openDb(dbName, 'app');
}

/**
 * Closes the database for `dbName`, removing it from the registry.
 * Subsequent opens will re-run the full open sequence.
 */
export async function closeDb(dbName: string): Promise<void> {
	const handle = _registry.get(dbName);
	if (!handle) return;
	_registry.delete(dbName);
	await handle.sqlite.closeAsync();
}

/**
 * Deletes the database file for `dbName`. Closes any open handle first.
 * Does NOT delete the Keychain key — call `deleteDatabaseKey(dbName)` separately
 * if the key should also be destroyed.
 */
export async function deleteDb(dbName: string): Promise<void> {
	await closeDb(dbName);
	await deleteDatabaseAsync(dbName, DB_DIRECTORY);
}

/**
 * Exposes the internal registry for testing only. Do not import outside tests.
 * @internal
 */
export function _getRegistry(): Map<string, DbHandle> {
	return _registry;
}

/**
 * Clears the registry without closing handles. For test teardown only.
 * @internal
 */
export function _clearRegistry(): void {
	_registry.clear();
}
