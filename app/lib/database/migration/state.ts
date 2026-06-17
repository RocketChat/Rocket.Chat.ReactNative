/**
 * MMKV-backed state machine for the wipe-and-restore DB migration.
 *
 * Two keys:
 *   `db_migration:v1:done`  — fast boolean, checked on every boot to skip the JSON parse entirely
 *   `db_migration:v1`       — full state JSON, only read/written during an active migration
 *
 * Phase sequence:
 *   detect → porting_servers → porting_active → wiping → finalizing → done
 *   detect → skipped  (fresh install: no legacy files found)
 *
 * The `done` fast-path key is written last, AFTER the state JSON records 'done',
 * so a crash between the two leaves the state JSON as the authoritative source.
 */

import userPreferences from '../../methods/userPreferences';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MigrationPhase = 'detect' | 'porting_servers' | 'porting_active' | 'wiping' | 'finalizing' | 'done' | 'skipped';

export type ServerStatus = 'pending' | 'ported' | 'wiped';

export interface MigrationState {
	schema: 1;
	phase: MigrationPhase;
	/** Keyed by server URL; only populated after detect enumerates legacy files. */
	servers: Record<string, ServerStatus>;
	startedAt: number;
	updatedAt: number;
}

// ---------------------------------------------------------------------------
// MMKV keys
// ---------------------------------------------------------------------------

/** Exported for test-only use — reference these from tests instead of duplicating the string. */
export const MIGRATION_KEY = 'db_migration:v1';
export const MIGRATION_DONE_KEY = 'db_migration:v1:done';

const KEY_STATE = MIGRATION_KEY;
const KEY_DONE = MIGRATION_DONE_KEY;

// ---------------------------------------------------------------------------
// Time injection — allows tests to fix timestamps without mocking Date globally
// ---------------------------------------------------------------------------

/** Overridable in tests: set to a fixed value before calling any state mutator. */
export let getNowMs: () => number = () => Date.now();

/** Injectable for tests — replaces the module-level time source. */
export function _setNowMs(fn: () => number): void {
	getNowMs = fn;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * O(1) fast path: returns true when migration is fully done.
 * Falls through to `readState()` only when the boolean flag is missing,
 * which happens only during an in-progress migration or the very first boot.
 */
export function isMigrationDone(): boolean {
	const flag = userPreferences.getBool(KEY_DONE);
	if (flag === true) return true;

	// Boolean flag absent — check the full state JSON to cover the crash window
	// where the state was set to 'done' but the boolean key wasn't written yet.
	const state = readState();
	return state?.phase === 'done' || state?.phase === 'skipped';
}

/** Returns the full migration state or null if never started. */
export function readState(): MigrationState | null {
	const raw = userPreferences.getMap(KEY_STATE);
	if (!raw || typeof raw !== 'object') return null;
	return raw as MigrationState;
}

/** Writes the full migration state object. */
export function writeState(state: MigrationState): void {
	userPreferences.setMap(KEY_STATE, state);
}

/**
 * Sets the phase field and bumps updatedAt.
 * Initialises a fresh state if one does not yet exist.
 */
export function setPhase(phase: MigrationPhase): void {
	const now = getNowMs();
	const existing = readState();
	const next: MigrationState = existing
		? { ...existing, phase, updatedAt: now }
		: { schema: 1, phase, servers: {}, startedAt: now, updatedAt: now };
	writeState(next);
}

/**
 * Records the status for a single server URL.
 * Requires the state to already exist (setPhase must have been called first).
 */
export function markServer(url: string, status: ServerStatus): void {
	const state = readState();
	if (!state) throw new Error('markServer called before state was initialised');
	writeState({ ...state, servers: { ...state.servers, [url]: status }, updatedAt: getNowMs() });
}

/**
 * Transitions to 'done' and writes the fast-path boolean.
 * The two writes are not atomic — the boolean is always written AFTER the state JSON.
 * A crash between the two is safe: `isMigrationDone()` reads the state JSON as fallback.
 */
export function markDone(): void {
	setPhase('done');
	userPreferences.setBool(KEY_DONE, true);
}

/** Transitions to 'skipped' (fresh install / no legacy files found). */
export function markSkipped(): void {
	setPhase('skipped');
	userPreferences.setBool(KEY_DONE, true);
}
