/**
 * Database connection lifecycle — open, key, configure, wrap with Drizzle, close.
 *
 * Files outside app/lib/database/driver/ must not import expo-sqlite; an ESLint rule
 * enforcing the ban arrives with the facade work.
 *
 * Open sequence (non-negotiable invariants):
 *   1. openDatabaseAsync → raw SQLiteDatabase handle
 *   2. PRAGMA key = "x'<64-hex>'"  ← must be the FIRST statement; SQLCipher
 *      requires this before any schema access or the file is opened unencrypted
 *      and subsequent reads produce garbage or "not a database" errors.
 *   3. PRAGMA busy_timeout = 500  ← mandatory; without it, concurrent access from
 *      the notification service extension causes SQLITE_BUSY starvation (multi-process
 *      WAL spike: 100% failure rate without it, 100% success with it)
 *   4. PRAGMA journal_mode = WAL
 *   5. Verify encryption with a trivial read (sqlite_master count) before handing out handle
 *   6. drizzle() wraps the raw handle with the appropriate schema
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
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import { Directory, Paths } from 'expo-file-system';

import * as appSchema from './schema/app';
import * as serversSchema from './schema/servers';
import appMigrations from './migrations/app/migrations';
import serversMigrations from './migrations/servers/migrations';
import { getOrCreateDatabaseKey } from './keyService';

type MigrationConfig = Parameters<typeof migrate>[1];

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

/** iOS subdirectory for new encrypted DBs, isolating them from legacy files at the container root. */
const DB_SUBDIRECTORY = 'SQLite';

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
		.replace(/\//g, '.');
	return `${sanitized}.db`;
}

// ---------------------------------------------------------------------------
// App Group directory resolution
// ---------------------------------------------------------------------------

/**
 * Returns the iOS directory for new encrypted database files: a `SQLite/`
 * subdirectory of the App Group container, created on first resolve.
 *
 * The subdirectory is load-bearing for the wipe-and-restore migration: legacy
 * plaintext WatermelonDB files live at the App Group ROOT (`<container>/default.db`).
 * Writing the new encrypted DBs there too would collide — `openServersDb()` would
 * open the legacy plaintext `default.db`, run PRAGMA key, and fail open-verify,
 * crashing every existing user on upgrade. Isolating new DBs in `SQLite/` mirrors
 * Android (`files/SQLite/`) and lets the migration read one location, write the other.
 *
 * Falls back to undefined (expo-sqlite default dir) when:
 *   - running on Android (expo-sqlite already uses its own `SQLite/` dir there)
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
		const sqliteDir = new Directory(container.uri, DB_SUBDIRECTORY);
		if (!sqliteDir.exists) {
			sqliteDir.create({ intermediates: true, idempotent: true });
		}
		// uri may carry a trailing slash; expo-sqlite wants a bare directory path
		return sqliteDir.uri.replace(/\/$/, '');
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

// ---------------------------------------------------------------------------
// Open
// ---------------------------------------------------------------------------

async function applyOpenPragmas(sqlite: SQLiteDatabase, keyHex: string): Promise<void> {
	// 1. Key MUST be first — before any schema read/write
	// Raw-key form: the x'...' prefix tells SQLCipher to skip PBKDF2
	await sqlite.execAsync(`PRAGMA key = "x'${keyHex}'";`);

	// 2. Busy timeout: mandatory for multi-process WAL safety (app + extensions share the file)
	await sqlite.execAsync('PRAGMA busy_timeout = 500;');

	// 3. WAL mode for concurrent reads + one writer
	await sqlite.execAsync('PRAGMA journal_mode = WAL;');

	// 4. Verify encryption is working — a trivial read on an unkeyed SQLCipher file
	// throws "file is not a database"; we surface a safe error that contains no key material
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
 */
async function openDb<K extends DbKind>(dbName: string, kind: K): Promise<DbHandle<K>> {
	const cached = _registry.get(dbName);
	if (cached) {
		return cached as DbHandle<K>;
	}

	const keyHex = await getOrCreateDatabaseKey(dbName);

	const sqlite = await openDatabaseAsync(dbName, { enableChangeListener: true }, DB_DIRECTORY);

	await applyOpenPragmas(sqlite, keyHex);

	const schema = kind === 'servers' ? serversSchema : appSchema;
	// The conditional type SchemaForKind<K> cannot be narrowed by the JS runtime check above;
	// casting through unknown is the standard TS pattern for this shape.
	const db = drizzle(sqlite, { schema }) as unknown as ExpoSQLiteDatabase<SchemaForKind<K>>;

	// Apply the schema DDL on the freshly keyed handle. The migrator creates tables on first
	// open and tracks applied migrations in __drizzle_migrations, so re-opens are no-ops.
	const migrations = (kind === 'servers' ? serversMigrations : appMigrations) as MigrationConfig;
	await migrate(db, migrations);

	const handle: DbHandle<K> = { db, sqlite, dbName };
	_registry.set(dbName, handle as DbHandle);
	return handle;
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
