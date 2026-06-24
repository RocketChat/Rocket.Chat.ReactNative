import { logEvent, events } from '../../methods/helpers/log';
import type { MigrationPhase } from './state';

export type MigrationOutcome = 'success' | 'failure' | 'skipped';

export type MigrationErrorCategory =
	| 'key_unavailable' // key or salt service threw
	| 'db_open_failed' // SQLCipher open or verify failed
	| 'legacy_read' // reading from the old WatermelonDB file failed
	| 'port_failed' // a data-porting step threw
	| 'unknown';

export function categorizeMigrationError(err: unknown): MigrationErrorCategory {
	if (!(err instanceof Error)) return 'unknown';
	const msg = err.message.toLowerCase();
	if (msg.includes('[migration/legacyreader]')) {
		return 'legacy_read';
	}
	if (/\b(keychain|key|salt|shim)\b/.test(msg)) {
		return 'key_unavailable';
	}
	if (msg.includes('open-verify') || msg.includes('not a database') || msg.includes('corrupt')) {
		return 'db_open_failed';
	}
	return 'unknown';
}

export function emitMigrationStart(): void {
	logEvent(events.DB_MIGRATION_START);
}

export function emitMigrationComplete(args: {
	outcome: MigrationOutcome;
	furthestPhase: MigrationPhase;
	durationMs: number;
	errorCategory?: MigrationErrorCategory;
}): void {
	logEvent(events.DB_MIGRATION_COMPLETE, {
		outcome: args.outcome,
		furthest_phase: args.furthestPhase,
		duration_ms: args.durationMs,
		...(args.errorCategory !== undefined ? { error_category: args.errorCategory } : {})
	});
}
