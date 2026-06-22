/**
 * Writes the port set from legacy plaintext rows into the new encrypted DB.
 *
 * All writes use INSERT OR REPLACE with bound params — idempotent by primary key `id`,
 * safe to re-run after a crash mid-phase. Values are NEVER string-concatenated.
 *
 * The new DB's raw `sqlite` handle is used directly, bypassing the facade. The facade's
 * prepareCreate defaults every schema column (sanitizedRaw) before insert, so using it to seed
 * a drafts-only row would write null defaults across the ~50 columns the server later syncs.
 * The migration instead touches only the columns it owns: additive tables use INSERT OR REPLACE
 * keyed by `id`; drafts and lock fields use INSERT OR IGNORE(id) + UPDATE so a row the server
 * recreates keeps its synced columns. All writes are idempotent and re-run safely after a crash.
 *
 * Column drift: legacy WatermelonDB tables carry internal `_status`/`_changed` columns the new
 * drizzle schema does not, and other columns may have been dropped or renamed across the two
 * schema versions. A full-row `INSERT (col, ...)` built from the legacy row's keys would throw
 * "no such column" on any legacy-only column. Every additive port intersects the legacy row's
 * columns with the new table's actual columns (read via PRAGMA table_info) and inserts only that
 * intersection — omitted columns are nullable or server-synced, so dropping them is safe.
 */

// Row writes run sequentially on a single SQLite connection (which serializes writes anyway);
// parallelising them buys nothing and loses the deterministic, resume-safe ordering the migration needs.
/* eslint-disable no-await-in-loop */
import type { SQLiteDatabase } from 'expo-sqlite';

import type { readLegacyServerLockFields, readLegacyDraftSubscriptions, readLegacyDraftThreads } from './legacyReader';
import { fileExists } from './legacyReader';

// Re-export type alias for clarity in orchestrator
export type LegacyRow = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Column-drift-safe additive insert
// ---------------------------------------------------------------------------

/**
 * Reads the actual column names of `tableName` in the new DB.
 * `tableName` is always a hardcoded literal from the callers below — never user input —
 * so interpolating it into the PRAGMA (which cannot take a bound param) is safe.
 */
async function targetColumns(tableName: string, newSqlite: SQLiteDatabase): Promise<Set<string>> {
	const info = (await newSqlite.getAllAsync(`PRAGMA table_info(${tableName});`)) as { name: string }[];
	return new Set(info.map(c => c.name));
}

/**
 * INSERT OR REPLACE each legacy row into `tableName`, restricted to columns the new table has.
 * Idempotent by primary key `id`; values are always bound params.
 */
async function insertRows(tableName: string, legacyRows: LegacyRow[], newSqlite: SQLiteDatabase): Promise<void> {
	if (legacyRows.length === 0) return;
	const allowed = await targetColumns(tableName, newSqlite);
	for (const row of legacyRows) {
		const cols = Object.keys(row).filter(c => allowed.has(c));
		if (cols.length === 0) continue;
		const placeholders = cols.map(() => '?').join(', ');
		const values = cols.map(c => row[c]);
		await newSqlite.runAsync(
			`INSERT OR REPLACE INTO ${tableName} (${cols.join(', ')}) VALUES (${placeholders});`,
			values as never[]
		);
	}
}

// ---------------------------------------------------------------------------
// Servers DB port
// ---------------------------------------------------------------------------

/**
 * Ports all columns of the legacy `users` table into the new servers DB.
 * Token values are bound params — never appear in logs or error messages.
 */
export async function portUsers(legacyRows: LegacyRow[], newSqlite: SQLiteDatabase): Promise<void> {
	await insertRows('users', legacyRows, newSqlite);
}

/**
 * Upserts only the four lock fields into the new servers DB `servers` table.
 * Rows that don't exist yet in the new DB are skipped (INSERT OR IGNORE + UPDATE).
 * Using INSERT OR IGNORE + UPDATE ensures we never blow away server-synced fields
 * while still writing the lock fields whether or not the server row exists yet.
 */
export async function portServerLockFields(
	legacyRows: Awaited<ReturnType<typeof readLegacyServerLockFields>>,
	newSqlite: SQLiteDatabase
): Promise<void> {
	for (const row of legacyRows) {
		// Ensure the row exists first (it may not if the new DB hasn't synced yet)
		await newSqlite.runAsync('INSERT OR IGNORE INTO servers (id) VALUES (?);', [row.id]);
		await newSqlite.runAsync(
			`UPDATE servers SET
				auto_lock = ?,
				auto_lock_time = ?,
				last_local_authenticated_session = ?,
				biometry = ?
			WHERE id = ?;`,
			[row.auto_lock, row.auto_lock_time, row.last_local_authenticated_session, row.biometry, row.id]
		);
	}
}

/**
 * Ports all columns of the legacy `servers_history` table.
 */
export async function portServersHistory(legacyRows: LegacyRow[], newSqlite: SQLiteDatabase): Promise<void> {
	await insertRows('servers_history', legacyRows, newSqlite);
}

// ---------------------------------------------------------------------------
// App DB port
// ---------------------------------------------------------------------------

/**
 * Ports pending-send messages (status 1 = TEMP, 2 = ERROR).
 * All columns from the legacy row are written; the server will update or discard on next sync.
 */
export async function portPendingMessages(legacyRows: LegacyRow[], newSqlite: SQLiteDatabase): Promise<void> {
	await insertRows('messages', legacyRows, newSqlite);
}

// tableName is always a hardcoded literal — never user input — so interpolation is safe.
async function portDraftColumn(
	tableName: string,
	legacyRows: { id: string; draft_message: string }[],
	newSqlite: SQLiteDatabase
): Promise<void> {
	for (const row of legacyRows) {
		await newSqlite.runAsync(`INSERT OR IGNORE INTO ${tableName} (id) VALUES (?);`, [row.id]);
		await newSqlite.runAsync(`UPDATE ${tableName} SET draft_message = ? WHERE id = ?;`, [row.draft_message, row.id]);
	}
}

export const portSubscriptionDrafts = (
	legacyRows: Awaited<ReturnType<typeof readLegacyDraftSubscriptions>>,
	newSqlite: SQLiteDatabase
): Promise<void> => portDraftColumn('subscriptions', legacyRows, newSqlite);

export const portThreadDrafts = (
	legacyRows: Awaited<ReturnType<typeof readLegacyDraftThreads>>,
	newSqlite: SQLiteDatabase
): Promise<void> => portDraftColumn('threads', legacyRows, newSqlite);

/**
 * Ports upload rows whose backing file still exists on disk.
 * Rows with a missing file are dropped — retrying a dead upload after migration would fail anyway.
 */
export async function portUploads(legacyRows: LegacyRow[], newSqlite: SQLiteDatabase): Promise<void> {
	const live = legacyRows.filter(row => {
		const { path } = row;
		return typeof path === 'string' && path.length > 0 && fileExists(path);
	});
	await insertRows('uploads', live, newSqlite);
}

/**
 * Ports all frequently_used_emojis rows.
 */
export async function portFrequentlyUsedEmojis(legacyRows: LegacyRow[], newSqlite: SQLiteDatabase): Promise<void> {
	await insertRows('frequently_used_emojis', legacyRows, newSqlite);
}
