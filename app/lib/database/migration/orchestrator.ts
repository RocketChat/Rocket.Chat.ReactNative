/**
 * Migration orchestrator — one-shot entry point for the wipe-and-restore migration.
 *
 * Crash safety: each phase transition is recorded in MMKV before the destructive
 * step that follows it. A crash leaves the phase at the last durable write, so
 * re-running resumes from that phase rather than from scratch.
 *
 * Idempotency: reads are non-destructive; additive writes use INSERT OR REPLACE while
 * drafts/lock fields use INSERT OR IGNORE + UPDATE; unlink of a missing file is silently
 * swallowed. Running twice produces the same result.
 *
 * Invoked at the top of the init saga's restore (the APP.INIT handler), before any server
 * data is read or re-auth is evaluated, while the bootsplash is still up.
 */

// Per-server porting and wiping run one server at a time: each is marked done before the next so a
// crash resumes cleanly. The ordering is the crash-safety guarantee, so the loops await in sequence.
/* eslint-disable no-await-in-loop */
import { deleteDatabaseAsync } from 'expo-sqlite';
import { File } from 'expo-file-system';

import { isMigrationDone, readState, setPhase, markServer, markDone, markSkipped, startPortingActive, getNowMs, type MigrationPhase } from './state';
import { emitMigrationStart, emitMigrationComplete, categorizeMigrationError } from './telemetry';
import {
	LEGACY_DIR,
	LEGACY_SERVERS_DB_NAME,
	legacyFileExists,
	openLegacy,
	deriveLegacyServerDbName,
	readLegacyUsers,
	readLegacyServerLockFields,
	readLegacyServersHistory,
	readLegacyPendingMessages,
	readLegacyDraftSubscriptions,
	readLegacyDraftThreads,
	readLegacyUploads,
	readLegacyFrequentlyUsedEmojis
} from './legacyReader';
import {
	portUsers,
	portServerLockFields,
	portServersHistory,
	portPendingMessages,
	portSubscriptionDrafts,
	portThreadDrafts,
	portUploads,
	portFrequentlyUsedEmojis
} from './port';
import { openServersDb, openServerDb } from '../driver/connection';

/**
 * Deletes a legacy plaintext DB file and its WAL/SHM sidecars. Idempotent.
 *
 * No secure-overwrite pass: flash storage wear-levels writes onto fresh physical blocks, so
 * overwriting a file's bytes does not erase the original data — an overwrite would be security
 * theater. Residual bytes in freed blocks are protected at rest by the OS (iOS Data Protection,
 * Android file-based encryption), not by anything done here. The reachable goal is a reliable
 * unlink of the main file plus both sidecars.
 */
export async function secureDelete(dir: string | undefined, dbName: string): Promise<void> {
	// Main file: deleteDatabaseAsync also tears down any open handle and, on iOS, the sidecars.
	try {
		await deleteDatabaseAsync(dbName, dir);
	} catch {
		// Missing file is not an error — unlink is idempotent
	}
	// WAL/SHM sidecars: deleteDatabaseAsync may leave these behind on Android. Remove explicitly.
	if (!dir) return;
	for (const suffix of ['-wal', '-shm']) {
		try {
			const sidecar = new File(`${dir}/${dbName}${suffix}`);
			if (sidecar.exists) sidecar.delete();
		} catch {
			// Best-effort: an absent or already-removed sidecar is fine
		}
	}
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Reads the list of server URLs from the legacy servers DB.
 * Returns an empty array when the table doesn't exist or the DB can't be read.
 */
async function readLegacyServerUrls(legacyServersDb: Awaited<ReturnType<typeof openLegacy>>): Promise<string[]> {
	try {
		const rows = (await legacyServersDb.getAllAsync('SELECT id FROM servers;')) as { id: string }[];
		return rows.map(r => r.id).filter(Boolean);
	} catch {
		return [];
	}
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

/**
 * Runs the wipe-and-restore migration if needed.
 * Safe to call on every app boot — the MMKV fast-path makes subsequent calls O(1).
 */
export async function runMigrationIfNeeded(): Promise<void> {
	// Fast path: already done (the overwhelming majority of boots after first upgrade)
	if (isMigrationDone()) return;

	const startMs = getNowMs();
	// Resume from the recorded phase, or start fresh
	let state = readState();
	let furthestPhase: MigrationPhase = state?.phase ?? 'detect';
	emitMigrationStart();

	try {
		// -----------------------------------------------------------------------
		// detect — enumerate legacy files; skip if none present (fresh install)
		// -----------------------------------------------------------------------
		if ((state?.phase ?? 'detect') === 'detect') {
			const hasServersDb = legacyFileExists(LEGACY_SERVERS_DB_NAME);
			if (!hasServersDb) {
				// No legacy files — fresh install or already wiped; nothing to migrate
				markSkipped();
				emitMigrationComplete({ outcome: 'skipped', furthestPhase, durationMs: getNowMs() - startMs });
				return;
			}
			// Initialise state with phase=porting_servers; server list populated after we read the DB
			setPhase('porting_servers');
			state = readState();
		}

		// -----------------------------------------------------------------------
		// porting_servers — port users + server lock fields + servers_history
		// -----------------------------------------------------------------------
		if (state?.phase === 'porting_servers') {
			furthestPhase = 'porting_servers';
			const legacyDb = await openLegacy(LEGACY_SERVERS_DB_NAME);
			try {
				const { sqlite: newSqlite } = await openServersDb();

				const [users, lockFields, history] = await Promise.all([
					readLegacyUsers(legacyDb),
					readLegacyServerLockFields(legacyDb),
					readLegacyServersHistory(legacyDb)
				]);

				await portUsers(users, newSqlite);
				await portServerLockFields(lockFields, newSqlite);
				await portServersHistory(history, newSqlite);

				// Capture server URLs before closing the legacy DB; we need them for porting_active
				const serverUrls = await readLegacyServerUrls(legacyDb);

				// Atomically advance to porting_active with every server URL marked pending
				startPortingActive(serverUrls);
				state = readState();
			} finally {
				await legacyDb.closeAsync().catch(() => {});
			}
		}

		// -----------------------------------------------------------------------
		// porting_active — port app DB data for each server
		// -----------------------------------------------------------------------
		if (state?.phase === 'porting_active') {
			furthestPhase = 'porting_active';
			const serverEntries = Object.entries(state.servers);
			for (const [url, status] of serverEntries) {
				if (status === 'ported' || status === 'wiped') continue;

				const dbName = deriveLegacyServerDbName(url);
				if (!legacyFileExists(dbName)) {
					// Legacy per-server DB missing — mark ported so wiping doesn't try to unlink it
					markServer(url, 'ported');
					continue;
				}

				const legacyDb = await openLegacy(dbName);
				try {
					const { sqlite: newSqlite } = await openServerDb(url);

					const [pendingMessages, draftSubs, draftThreads, uploads, emojis] = await Promise.all([
						readLegacyPendingMessages(legacyDb),
						readLegacyDraftSubscriptions(legacyDb),
						readLegacyDraftThreads(legacyDb),
						readLegacyUploads(legacyDb),
						readLegacyFrequentlyUsedEmojis(legacyDb)
					]);

					await portPendingMessages(pendingMessages, newSqlite);
					await portSubscriptionDrafts(draftSubs, newSqlite);
					await portThreadDrafts(draftThreads, newSqlite);
					await portUploads(uploads, newSqlite);
					await portFrequentlyUsedEmojis(emojis, newSqlite);

					markServer(url, 'ported');
				} finally {
					await legacyDb.closeAsync().catch(() => {});
				}
			}

			setPhase('wiping');
			state = readState();
		}

		// -----------------------------------------------------------------------
		// wiping — delete each legacy file + sidecars, then the servers DB
		// -----------------------------------------------------------------------
		if (state?.phase === 'wiping') {
			furthestPhase = 'wiping';
			for (const [url, status] of Object.entries(state.servers)) {
				if (status === 'wiped') continue;
				const dbName = deriveLegacyServerDbName(url);
				await secureDelete(LEGACY_DIR, dbName);
				markServer(url, 'wiped');
			}
			// Wipe the servers DB last — it was the entry point for detect
			await secureDelete(LEGACY_DIR, LEGACY_SERVERS_DB_NAME);

			setPhase('finalizing');
			state = readState();
		}

		// -----------------------------------------------------------------------
		// finalizing — mark done
		// -----------------------------------------------------------------------
		if (state?.phase === 'finalizing') {
			furthestPhase = 'finalizing';
			// No backup-exclusion step: the new DB is SQLCipher-encrypted with a device-only key
			// (iOS kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly, non-synchronizable; Android Keystore)
			// and Android sets allowBackup=false app-wide. A backed-up DB is ciphertext whose key can never
			// be in the backup, so excluding the file would add nothing.
			markDone();
		}

		emitMigrationComplete({ outcome: 'success', furthestPhase: 'done', durationMs: getNowMs() - startMs });
	} catch (err) {
		emitMigrationComplete({
			outcome: 'failure',
			furthestPhase,
			durationMs: getNowMs() - startMs,
			errorCategory: categorizeMigrationError(err)
		});
		throw err;
	}
}
