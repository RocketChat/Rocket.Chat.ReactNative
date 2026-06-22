/**
 * Migration telemetry tests — Jest, fully mocked.
 *
 * Verifies that emitMigrationStart and emitMigrationComplete are called with the
 * correct arguments for each migration outcome (skipped, success, failure).
 */

const mockLegacyDir = '/fake/legacy';

// ---------------------------------------------------------------------------
// userPreferences mock
// ---------------------------------------------------------------------------

const mockMmkvStore = new Map<string, string | boolean | number>();

jest.mock('../../../methods/userPreferences', () => ({
	__esModule: true,
	default: {
		getBool: (k: string) => {
			const v = mockMmkvStore.get(k);
			return typeof v === 'boolean' ? v : null;
		},
		setBool: (k: string, v: boolean) => mockMmkvStore.set(k, v),
		getMap: (k: string) => {
			const v = mockMmkvStore.get(k);
			return typeof v === 'string' ? JSON.parse(v) : null;
		},
		setMap: (k: string, v: object) => mockMmkvStore.set(k, JSON.stringify(v)),
		getString: (k: string) => {
			const v = mockMmkvStore.get(k);
			return typeof v === 'string' ? v : null;
		},
		setString: (k: string, v: string) => mockMmkvStore.set(k, v),
		removeItem: (k: string) => mockMmkvStore.delete(k)
	}
}));

jest.mock('react-native', () => ({
	Platform: { OS: 'ios' }
}));

// ---------------------------------------------------------------------------
// expo-sqlite mock
// ---------------------------------------------------------------------------

const mockLegacyRows: Record<string, Record<string, unknown[]>> = {};
const mockNewDbWrites: Record<string, { sql: string; args: unknown[] }[]> = {};
const mockNewSqliteMocks: Record<string, ReturnType<typeof mockMakeNewSqlite>> = {};

const mockNewDbColumns: Record<string, string[]> = {
	users: ['id', 'token', 'username', 'name', 'language', 'status'],
	servers_history: ['id', 'url', 'username', 'updated_at', 'icon_url'],
	messages: ['id', 'msg', 't', 'rid', 'ts', 'u', 'status', 'attachments', 'tmid', 'content'],
	uploads: ['id', 'path', 'rid', 'name', 'tmid', 'description', 'size', 'type', 'store', 'progress', 'error'],
	frequently_used_emojis: ['id', 'content', 'extension', 'is_custom', 'count']
};

function mockMakeNewSqlite(dbName: string) {
	if (!mockNewDbWrites[dbName]) mockNewDbWrites[dbName] = [];
	return {
		runAsync: jest.fn(async (sql: string, args?: unknown[]) => {
			mockNewDbWrites[dbName].push({ sql, args: args ?? [] });
		}),
		execAsync: jest.fn(async () => {}),
		getFirstAsync: jest.fn(async () => ({ count: 0 })),
		getAllAsync: jest.fn(async (sql: string) => {
			const tbl = sql.match(/PRAGMA\s+table_info\((\w+)\)/i)?.[1];
			if (tbl) return (mockNewDbColumns[tbl] ?? []).map(name => ({ name }));
			return [];
		}),
		closeAsync: jest.fn(async () => {})
	};
}

function mockMakeLegacySqlite(dbName: string) {
	return {
		runAsync: jest.fn(async () => {}),
		execAsync: jest.fn(async () => {}),
		getFirstAsync: jest.fn(async () => ({ count: 0 })),
		getAllAsync: jest.fn(async (sql: string) => {
			const tbl = sql.match(/FROM\s+(\w+)/i)?.[1];
			if (!tbl) return [];
			const all = (mockLegacyRows[dbName]?.[tbl] ?? []) as Record<string, unknown>[];
			if (sql.includes('status IN (1, 2)')) return all.filter(r => r.status === 1 || r.status === 2);
			if (sql.includes("draft_message IS NOT NULL AND draft_message != ''")) {
				return all.filter(r => r.draft_message && r.draft_message !== '');
			}
			if (sql.includes('SELECT id FROM servers')) return all.map(r => ({ id: r.id }));
			return all;
		}),
		closeAsync: jest.fn(async () => {})
	};
}

jest.mock('expo-sqlite', () => ({
	openDatabaseAsync: jest.fn(async (dbName: string, _opts?: unknown, dir?: string) => {
		if (dir === mockLegacyDir) return mockMakeLegacySqlite(dbName);
		if (!mockNewSqliteMocks[dbName]) mockNewSqliteMocks[dbName] = mockMakeNewSqlite(dbName);
		return mockNewSqliteMocks[dbName];
	}),
	deleteDatabaseAsync: jest.fn(async () => {})
}));

// ---------------------------------------------------------------------------
// expo-file-system mock
// ---------------------------------------------------------------------------

const mockExistingFiles = new Set<string>();

jest.mock('expo-file-system', () => ({
	Paths: {
		appleSharedContainers: { 'group.ios.chat.rocket': { uri: '/fake/legacy/' } },
		document: { uri: '/fake/files/' }
	},
	Directory: class {
		uri: string;
		exists = false;
		constructor(...parts: string[]) {
			this.uri = parts.join('/').replace(/\/+/g, '/');
		}
		create() {}
	},
	File: class {
		uri: string;
		constructor(...parts: string[]) {
			this.uri = parts.join('/').replace(/\/+/g, '/');
		}
		get exists() {
			return mockExistingFiles.has(this.uri);
		}
		delete() {
			mockExistingFiles.delete(this.uri);
		}
	}
}));

// ---------------------------------------------------------------------------
// drizzle / keyService mocks
// ---------------------------------------------------------------------------

jest.mock('drizzle-orm/expo-sqlite', () => ({ drizzle: jest.fn(() => ({})) }));
jest.mock('drizzle-orm/expo-sqlite/migrator', () => ({ migrate: jest.fn(async () => {}) }));

jest.mock('../../driver/keyService', () => ({
	getOrCreateDatabaseKey: jest.fn(async () => 'a'.repeat(64)),
	getOrCreateDatabaseSalt: jest.fn(async () => 'b'.repeat(32)),
	deleteDatabaseKey: jest.fn(async () => {})
}));

// ---------------------------------------------------------------------------
// connection mock — allows per-test rejection override
// ---------------------------------------------------------------------------

const mockOpenServersDb = jest.fn();
const mockOpenServerDb = jest.fn();

jest.mock('../../driver/connection', () => ({
	openServersDb: (...args: unknown[]) => mockOpenServersDb(...args),
	openServerDb: (...args: unknown[]) => mockOpenServerDb(...args),
	_clearRegistry: jest.fn()
}));

// ---------------------------------------------------------------------------
// telemetry mock — spy on emitters, keep real categorizeMigrationError
// ---------------------------------------------------------------------------

const mockEmitMigrationStart = jest.fn();
const mockEmitMigrationComplete = jest.fn();

// Pull in the real categorizeMigrationError from the actual module before mocking
import { categorizeMigrationError } from '../telemetry';

jest.mock('../telemetry', () => {
	// Re-use the real categorizer so failure-category tests exercise actual logic
	const real = jest.requireActual('../telemetry');
	return {
		...real,
		emitMigrationStart: (...args: unknown[]) => mockEmitMigrationStart(...args),
		emitMigrationComplete: (...args: unknown[]) => mockEmitMigrationComplete(...args)
	};
});

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { MIGRATION_DONE_KEY, MIGRATION_KEY, _setNowMs } from '../state';
import { _setLegacyDir, _setFileExists } from '../legacyReader';
import { runMigrationIfNeeded } from '../orchestrator';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clearAll() {
	mockMmkvStore.clear();
	for (const k of Object.keys(mockLegacyRows)) delete mockLegacyRows[k];
	for (const k of Object.keys(mockNewDbWrites)) delete mockNewDbWrites[k];
	for (const k of Object.keys(mockNewSqliteMocks)) delete mockNewSqliteMocks[k];
	mockExistingFiles.clear();
}

function seedLegacyDb(dbName: string, table: string, rows: Record<string, unknown>[]) {
	if (!mockLegacyRows[dbName]) mockLegacyRows[dbName] = {};
	mockLegacyRows[dbName][table] = rows;
}

function makeDefaultNewSqlite() {
	const sqlite = mockMakeNewSqlite('default.db');
	return { sqlite, drizzle: {} };
}

function makeServerNewSqlite(dbName: string) {
	const sqlite = mockMakeNewSqlite(dbName);
	return { sqlite, drizzle: {} };
}

const fakeNow = 1_000_000;

beforeEach(() => {
	clearAll();
	_setLegacyDir(mockLegacyDir);
	_setFileExists(() => false);
	_setNowMs(() => fakeNow);
	mockEmitMigrationStart.mockClear();
	mockEmitMigrationComplete.mockClear();
	// Default: openServersDb and openServerDb succeed
	mockOpenServersDb.mockImplementation(async () => makeDefaultNewSqlite());
	mockOpenServerDb.mockImplementation(async (url: string) => makeServerNewSqlite(url.replace(/[^a-z0-9]/gi, '_') + '.db'));
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('migration telemetry', () => {
	it('does not emit when migration is already done', async () => {
		mockMmkvStore.set(MIGRATION_DONE_KEY, true);
		await runMigrationIfNeeded();
		expect(mockEmitMigrationStart).not.toHaveBeenCalled();
		expect(mockEmitMigrationComplete).not.toHaveBeenCalled();
	});

	it('emits start then complete(skipped) when no legacy files', async () => {
		await runMigrationIfNeeded();
		expect(mockEmitMigrationStart).toHaveBeenCalledTimes(1);
		expect(mockEmitMigrationComplete).toHaveBeenCalledTimes(1);
		expect(mockEmitMigrationComplete).toHaveBeenCalledWith({
			outcome: 'skipped',
			furthestPhase: 'detect',
			durationMs: expect.any(Number)
		});
	});

	it('emits start then complete(success) on a full migration', async () => {
		const SERVER_DB = 'open.rocket.chat.db';
		_setFileExists(path => path.includes('default.db') || path.includes(SERVER_DB));

		seedLegacyDb('default.db', 'users', [{ id: 'u1', username: 'alice', token: 'tok' }]);
		seedLegacyDb('default.db', 'servers', [{ id: 'https://open.rocket.chat' }]);
		seedLegacyDb('default.db', 'servers_history', []);
		for (const t of ['messages', 'subscriptions', 'threads', 'uploads', 'frequently_used_emojis']) {
			seedLegacyDb(SERVER_DB, t, []);
		}

		mockOpenServerDb.mockImplementation(async () => makeServerNewSqlite(SERVER_DB));

		await runMigrationIfNeeded();

		expect(mockEmitMigrationStart).toHaveBeenCalledTimes(1);
		expect(mockEmitMigrationComplete).toHaveBeenCalledTimes(1);
		expect(mockEmitMigrationComplete).toHaveBeenCalledWith({
			outcome: 'success',
			furthestPhase: 'done',
			durationMs: expect.any(Number)
		});
	});

	it('emits start then complete(failure) with furthestPhase when porting_servers throws', async () => {
		_setFileExists(path => path.includes('default.db'));
		seedLegacyDb('default.db', 'users', []);
		seedLegacyDb('default.db', 'servers', []);
		seedLegacyDb('default.db', 'servers_history', []);

		mockOpenServersDb.mockRejectedValueOnce(new Error('open-verify failed — not a database'));

		await expect(runMigrationIfNeeded()).rejects.toThrow();

		expect(mockEmitMigrationStart).toHaveBeenCalledTimes(1);
		expect(mockEmitMigrationComplete).toHaveBeenCalledTimes(1);
		expect(mockEmitMigrationComplete).toHaveBeenCalledWith({
			outcome: 'failure',
			furthestPhase: 'porting_servers',
			durationMs: expect.any(Number),
			errorCategory: 'db_open_failed'
		});
	});

	it('emits start then complete(failure) with furthestPhase when porting_active throws', async () => {
		// Pre-seed state at porting_active so the orchestrator resumes there
		mockMmkvStore.set(
			MIGRATION_KEY,
			JSON.stringify({
				schema: 1,
				phase: 'porting_active',
				servers: { 'https://open.rocket.chat': 'pending' },
				startedAt: fakeNow,
				updatedAt: fakeNow
			})
		);
		const SERVER_DB = 'open.rocket.chat.db';
		_setFileExists(path => path.includes(SERVER_DB));
		seedLegacyDb(SERVER_DB, 'messages', []);
		seedLegacyDb(SERVER_DB, 'subscriptions', []);
		seedLegacyDb(SERVER_DB, 'threads', []);
		seedLegacyDb(SERVER_DB, 'uploads', []);
		seedLegacyDb(SERVER_DB, 'frequently_used_emojis', []);

		mockOpenServerDb.mockRejectedValueOnce(new Error('some port error'));

		await expect(runMigrationIfNeeded()).rejects.toThrow();

		expect(mockEmitMigrationComplete).toHaveBeenCalledWith({
			outcome: 'failure',
			furthestPhase: 'porting_active',
			durationMs: expect.any(Number),
			errorCategory: 'unknown'
		});
	});

	it('emits start then complete(failure) with key_unavailable category', async () => {
		_setFileExists(path => path.includes('default.db'));
		seedLegacyDb('default.db', 'users', []);
		seedLegacyDb('default.db', 'servers', []);
		seedLegacyDb('default.db', 'servers_history', []);

		mockOpenServersDb.mockRejectedValueOnce(new Error('key may be wrong'));

		await expect(runMigrationIfNeeded()).rejects.toThrow();

		expect(mockEmitMigrationComplete).toHaveBeenCalledWith(
			expect.objectContaining({ outcome: 'failure', errorCategory: 'key_unavailable' })
		);
	});

	it('duration_ms reflects time elapsed between start and end', async () => {
		let callCount = 0;
		_setNowMs(() => {
			callCount++;
			// First call (startMs): 1000; subsequent calls: 1250
			return callCount === 1 ? 1000 : 1250;
		});

		await runMigrationIfNeeded();

		expect(mockEmitMigrationComplete).toHaveBeenCalledWith(expect.objectContaining({ durationMs: 250 }));
	});
});

// ---------------------------------------------------------------------------
// categorizeMigrationError unit tests
// ---------------------------------------------------------------------------

describe('categorizeMigrationError', () => {
	it('returns key_unavailable for key-related messages', () => {
		expect(categorizeMigrationError(new Error('stored key corrupt'))).toBe('key_unavailable');
		expect(categorizeMigrationError(new Error('keychain shim not installed'))).toBe('key_unavailable');
		expect(categorizeMigrationError(new Error('salt generation failed'))).toBe('key_unavailable');
		expect(categorizeMigrationError(new Error('shim not ready'))).toBe('key_unavailable');
	});

	it('returns db_open_failed for open-verify / corrupt messages', () => {
		expect(categorizeMigrationError(new Error('open-verify failed'))).toBe('db_open_failed');
		expect(categorizeMigrationError(new Error('not a database'))).toBe('db_open_failed');
		expect(categorizeMigrationError(new Error('stored key corrupt'))).toBe('key_unavailable'); // key wins
	});

	it('returns unknown for unrecognised errors', () => {
		expect(categorizeMigrationError(new Error('network timeout'))).toBe('unknown');
		expect(categorizeMigrationError('a string')).toBe('unknown');
		expect(categorizeMigrationError(null)).toBe('unknown');
	});
});
