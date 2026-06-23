/**
 * Read-only access to legacy WatermelonDB plaintext SQLite files.
 *
 * SQLCipher is compiled into expo-sqlite but reads plaintext files without a key
 * (omitting PRAGMA key means SQLCipher treats the file as unencrypted). No key
 * material is written, read, or logged here.
 *
 * iOS layout: WMDB received `dbName = <appGroupRoot><name>.db` — an absolute path, so the native
 *   adapter (WMDatabaseDriver `pathForName:`) used it verbatim. Legacy files therefore live at the
 *   App Group container ROOT with a SINGLE `.db` (`<container>/default.db`, `<container>/open.rocket.chat.db`).
 *   New encrypted DBs live in `<container>/SQLite/`. That separation lets the migration read one and write the other.
 *
 * Android layout: WMDB received a bare `dbName = <name>.db` (appGroupPath is empty on Android), then
 *   `WMDatabase.createSQLiteDatabase` ran `context.getDatabasePath(name + ".db").replace("/databases", "")`.
 *   That appends a SECOND `.db` and strips the `/databases` segment, so legacy files live at the app-data
 *   ROOT (the parent of the files dir) with a DOUBLE `.db.db` suffix (`<dataRoot>/default.db.db`,
 *   `<dataRoot>/open.rocket.chat.db.db`). Reading `<dataRoot>/databases` or a single-`.db` name finds nothing.
 */

import { Platform } from 'react-native';
import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import { File, Paths } from 'expo-file-system';

const APP_GROUP_ID = 'group.ios.chat.rocket';

/**
 * The on-disk suffix WMDB used for legacy plaintext files. iOS got a single `.db` (RC passed an
 * absolute path the native adapter used verbatim); Android got `.db.db` (the native adapter appended
 * a second `.db` to RC's already-`.db`-terminated name). See the file header for the full derivation.
 */
const LEGACY_DB_SUFFIX = Platform.OS === 'android' ? '.db.db' : '.db';

/** The legacy global/servers DB filename, platform-aware. */
export const LEGACY_SERVERS_DB_NAME = `default${LEGACY_DB_SUFFIX}`;

// ---------------------------------------------------------------------------
// Directory resolution
// ---------------------------------------------------------------------------

/**
 * Returns the directory that contains legacy WatermelonDB plaintext files, or undefined
 * when it cannot be determined (unit tests, fresh Android install without the folder).
 *
 * iOS  — App Group container root (no subdirectory).
 * Android — the app-data root (parent of the files dir), where WMDB landed after stripping `/databases`.
 */
export function resolveLegacyDbDirectory(): string | undefined {
	if (Platform.OS === 'ios') {
		try {
			const containers = Paths.appleSharedContainers as Record<string, { uri: string } | undefined>;
			const container = containers[APP_GROUP_ID];
			if (!container?.uri) {
				console.warn('[migration/legacyReader] App Group container not found — cannot read legacy DBs');
				return undefined;
			}
			// Strip trailing slash; expo-sqlite wants a bare directory path
			return container.uri.replace(/\/$/, '');
		} catch (e) {
			console.warn('[migration/legacyReader] Failed to resolve App Group container:', (e as Error).message);
			return undefined;
		}
	}

	// Android: WMDB stripped the `/databases` segment, so legacy files sit in the app-data root —
	// the parent of the files dir (files dir is `<dataRoot>/files`).
	try {
		// Paths.document is a Directory object (not a string); .uri gives the file:// URI string
		const docDir = (Paths as unknown as Record<string, { uri?: string } | undefined>).document;
		const filesDir: string | undefined = docDir?.uri;
		if (!filesDir) {
			console.warn('[migration/legacyReader] Could not resolve filesDir on Android — legacy DB location unknown');
			return undefined;
		}
		const base = filesDir.replace(/\/$/, '');
		return base.substring(0, base.lastIndexOf('/'));
	} catch (e) {
		console.warn('[migration/legacyReader] Android legacy DB directory resolution failed:', (e as Error).message);
		return undefined;
	}
}

// Resolved once at module load — the container path is stable for the process lifetime.
// Exported for tests to override via jest.mock or module-level patching.
export let LEGACY_DIR: string | undefined = resolveLegacyDbDirectory();

/** Injectable for tests that cannot mock expo-file-system at module load. */
export function _setLegacyDir(dir: string | undefined): void {
	LEGACY_DIR = dir;
}

// ---------------------------------------------------------------------------
// File existence helpers
// ---------------------------------------------------------------------------

/** Injectable file-existence check — real impl uses expo-file-system File; tests mock this. */
export let fileExists: (path: string) => boolean = path => {
	try {
		return new File(path).exists;
	} catch {
		return false;
	}
};

export function _setFileExists(fn: (path: string) => boolean): void {
	fileExists = fn;
}

/**
 * Returns true when a legacy DB file for `dbName` exists in the legacy directory.
 * Checks only the `.db` main file, not sidecars.
 */
export function legacyFileExists(dbName: string): boolean {
	if (!LEGACY_DIR) return false;
	return fileExists(`${LEGACY_DIR}/${dbName}`);
}

/**
 * Mirrors the legacy WMDB on-disk per-server filename: strip scheme, replace slashes with dots,
 * append the platform-aware legacy suffix (`.db` on iOS, `.db.db` on Android).
 *
 * LEGACY-file address only — distinct from `connection.deriveServerDbName`, which names the
 * NEW encrypted files with a single `.db` on both platforms.
 */
export function deriveLegacyServerDbName(serverUrl: string): string {
	const sanitized = serverUrl
		.replace(/\/+$/, '')
		.replace(/(^\w+:|^)\/\//, '')
		.replace(/\//g, '.');
	return `${sanitized}${LEGACY_DB_SUFFIX}`;
}

// ---------------------------------------------------------------------------
// Open
// ---------------------------------------------------------------------------

/**
 * Opens a legacy plaintext SQLite file read-only (no PRAGMA key).
 * Caller is responsible for closing the handle when done.
 */
export async function openLegacy(dbName: string): Promise<SQLiteDatabase> {
	// No PRAGMA key — SQLCipher opens plaintext files transparently without one.
	// Open with the default options; enableChangeListener not needed (read-only usage).
	const db = await openDatabaseAsync(dbName, {}, LEGACY_DIR);
	// Verify the file is actually readable before returning
	try {
		await db.getFirstAsync('SELECT count(*) FROM sqlite_master;');
	} catch (e) {
		await db.closeAsync().catch(() => {});
		// Log only the db name, never path or content that might contain key material
		throw new Error(`[migration/legacyReader] Cannot read legacy DB '${dbName}': file missing or corrupt`);
	}
	return db;
}

// ---------------------------------------------------------------------------
// Raw SELECT helpers — return plain row objects via getAllAsync
// ---------------------------------------------------------------------------

/** All rows from legacy servers DB `users` table. */
export function readLegacyUsers(db: SQLiteDatabase): Promise<Record<string, unknown>[]> {
	return db.getAllAsync('SELECT * FROM users;') as Promise<Record<string, unknown>[]>;
}

type LegacyServerLockFields = {
	id: string;
	auto_lock: number | null;
	auto_lock_time: number | null;
	last_local_authenticated_session: number | null;
	biometry: number | null;
};

/**
 * Lock fields from legacy servers DB `servers` table.
 * Only the fields that are user-authored / device-local are ported; everything else resyncs.
 */
export function readLegacyServerLockFields(db: SQLiteDatabase): Promise<LegacyServerLockFields[]> {
	return db.getAllAsync(
		'SELECT id, auto_lock, auto_lock_time, last_local_authenticated_session, biometry FROM servers;'
	) as Promise<LegacyServerLockFields[]>;
}

/** All rows from legacy servers DB `servers_history` table. */
export function readLegacyServersHistory(db: SQLiteDatabase): Promise<Record<string, unknown>[]> {
	return db.getAllAsync('SELECT * FROM servers_history;') as Promise<Record<string, unknown>[]>;
}

/**
 * Pending-send messages: status 1 (TEMP) or 2 (ERROR).
 * Everything else is resynced from the server.
 */
export function readLegacyPendingMessages(db: SQLiteDatabase): Promise<Record<string, unknown>[]> {
	return db.getAllAsync('SELECT * FROM messages WHERE status IN (1, 2);') as Promise<Record<string, unknown>[]>;
}

/** Subscriptions with a non-empty draft_message. */
export function readLegacyDraftSubscriptions(db: SQLiteDatabase): Promise<{ id: string; draft_message: string }[]> {
	return db.getAllAsync(
		"SELECT id, draft_message FROM subscriptions WHERE draft_message IS NOT NULL AND draft_message != '';"
	) as Promise<{ id: string; draft_message: string }[]>;
}

/** Threads with a non-empty draft_message. */
export function readLegacyDraftThreads(db: SQLiteDatabase): Promise<{ id: string; draft_message: string }[]> {
	return db.getAllAsync(
		"SELECT id, draft_message FROM threads WHERE draft_message IS NOT NULL AND draft_message != '';"
	) as Promise<{ id: string; draft_message: string }[]>;
}

/**
 * All uploads rows. The orchestrator filters to only those whose file still exists on disk.
 * We fetch all here; filtering in port.ts keeps the SQL simple and the boundary clear.
 */
export function readLegacyUploads(db: SQLiteDatabase): Promise<Record<string, unknown>[]> {
	return db.getAllAsync('SELECT * FROM uploads;') as Promise<Record<string, unknown>[]>;
}

/** All frequently_used_emojis rows. */
export function readLegacyFrequentlyUsedEmojis(db: SQLiteDatabase): Promise<Record<string, unknown>[]> {
	return db.getAllAsync('SELECT * FROM frequently_used_emojis;') as Promise<Record<string, unknown>[]>;
}
