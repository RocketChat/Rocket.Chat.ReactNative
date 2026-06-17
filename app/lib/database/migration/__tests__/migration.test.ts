/**
 * Migration tests — Jest, fully mocked (no real sqlite, MMKV, or filesystem).
 *
 * Covers:
 *  - Fast-path skip when done flag is set
 *  - detect with no legacy files → skipped
 *  - Full port path: seeded fake legacy rows assert correct new-DB writes
 *  - status IN (1,2) filter for pending messages
 *  - Non-empty-draft filter for subscriptions and threads
 *  - File-exists filter for uploads
 *  - Drafts port via INSERT OR IGNORE + UPDATE (never REPLACE) so server-synced columns survive
 *  - Crash-resume: interrupt after porting_servers, re-run resumes at porting_active
 *  - Idempotency: legacy files gone after wipe → second run skips
 *  - Wiping unlinks each legacy file
 *
 * Shared mutable state referenced inside jest.mock() factories MUST be `mock`-prefixed
 * (babel-jest's out-of-scope guard). New vs legacy DB opens are discriminated by directory:
 * the legacy reader opens at LEGACY_DIR ('/fake/legacy'); the new driver opens in the
 * '/fake/legacy/SQLite' subdirectory. Keying by dbName alone collides (both servers DBs
 * are 'default.db'), so the mock decides by `dir`.
 */

const mockLegacyDir = '/fake/legacy';

// ---------------------------------------------------------------------------
// userPreferences mock — in-memory store backing state.ts (severs the heavy
// helpers → Toast → react-native-easy-toast import chain that the real module pulls in)
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

// connection.ts and legacyReader.ts read Platform.OS directly
jest.mock('react-native', () => ({
	Platform: { OS: 'ios' }
}));

// ---------------------------------------------------------------------------
// expo-sqlite mock
// ---------------------------------------------------------------------------

// Per-dbName row stores for legacy DBs; new DB write logs keyed by dbName
const mockLegacyRows: Record<string, Record<string, unknown[]>> = {};
const mockNewDbWrites: Record<string, { sql: string; args: unknown[] }[]> = {};
const mockDeletedDbs: string[] = [];
// Files that secureDelete's sidecar pass sees as present, and the URIs it deletes
const mockExistingFiles = new Set<string>();
const mockDeletedFiles: string[] = [];
// New-DB sqlite mocks persist across re-opens of the same name within a test
const mockNewSqliteMocks: Record<string, ReturnType<typeof mockMakeNewSqlite>> = {};

// Real column names of the new (drizzle) tables exercised by the port — used to answer
// PRAGMA table_info so insertRows can drop legacy-only columns (WMDB's _status/_changed, drift).
// Deliberately excludes _status/_changed so the drift-stripping test has teeth.
const mockNewDbColumns: Record<string, string[]> = {
	users: [
		'id',
		'token',
		'username',
		'name',
		'language',
		'status',
		'statusText',
		'roles',
		'login_email_password',
		'show_message_in_main_thread',
		'avatar_etag',
		'is_from_webview',
		'enable_message_parser_early_adoption',
		'nickname',
		'bio',
		'require_password_change'
	],
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
			if (sql.includes('status IN (1, 2)')) {
				return all.filter(r => r.status === 1 || r.status === 2);
			}
			if (sql.includes("draft_message IS NOT NULL AND draft_message != ''")) {
				return all.filter(r => r.draft_message && r.draft_message !== '');
			}
			if (sql.includes('SELECT id FROM servers')) {
				return all.map(r => ({ id: r.id }));
			}
			return all;
		}),
		closeAsync: jest.fn(async () => {})
	};
}

jest.mock('expo-sqlite', () => ({
	openDatabaseAsync: jest.fn(async (dbName: string, _opts?: unknown, dir?: string) => {
		// Legacy reader opens at the container root; the new driver opens in the SQLite subdir.
		if (dir === mockLegacyDir) {
			return mockMakeLegacySqlite(dbName);
		}
		if (!mockNewSqliteMocks[dbName]) {
			mockNewSqliteMocks[dbName] = mockMakeNewSqlite(dbName);
		}
		return mockNewSqliteMocks[dbName];
	}),
	deleteDatabaseAsync: jest.fn(async (dbName: string) => {
		mockDeletedDbs.push(dbName);
	})
}));

// ---------------------------------------------------------------------------
// expo-file-system mock
// ---------------------------------------------------------------------------

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
			mockDeletedFiles.push(this.uri);
			mockExistingFiles.delete(this.uri);
		}
	}
}));

// ---------------------------------------------------------------------------
// drizzle-orm / migrator / keyService mocks (pulled in transitively by connection.ts)
// ---------------------------------------------------------------------------

jest.mock('drizzle-orm/expo-sqlite', () => ({ drizzle: jest.fn(() => ({})) }));
jest.mock('drizzle-orm/expo-sqlite/migrator', () => ({ migrate: jest.fn(async () => {}) }));

jest.mock('../../driver/keyService', () => ({
	getOrCreateDatabaseKey: jest.fn(async () => 'a'.repeat(64)),
	deleteDatabaseKey: jest.fn(async () => {})
}));

// ---------------------------------------------------------------------------
// Imports (after mocks are set up)
// ---------------------------------------------------------------------------

import { isMigrationDone, readState, _setNowMs, MIGRATION_DONE_KEY, MIGRATION_KEY } from '../state';
import { _setLegacyDir, _setFileExists } from '../legacyReader';
import { runMigrationIfNeeded } from '../orchestrator';
import { _clearRegistry } from '../../driver/connection';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clearAll() {
	mockMmkvStore.clear();
	for (const k of Object.keys(mockLegacyRows)) delete mockLegacyRows[k];
	for (const k of Object.keys(mockNewDbWrites)) delete mockNewDbWrites[k];
	for (const k of Object.keys(mockNewSqliteMocks)) delete mockNewSqliteMocks[k];
	mockDeletedDbs.length = 0;
	mockExistingFiles.clear();
	mockDeletedFiles.length = 0;
	_clearRegistry();
}

function seedLegacyDb(dbName: string, table: string, rows: Record<string, unknown>[]) {
	if (!mockLegacyRows[dbName]) mockLegacyRows[dbName] = {};
	mockLegacyRows[dbName][table] = rows;
}

const fakeNow = 1_000_000;

beforeEach(() => {
	clearAll();
	_setLegacyDir(mockLegacyDir);
	_setFileExists(() => false);
	_setNowMs(() => fakeNow);
});

// ---------------------------------------------------------------------------
// Fast-path skip
// ---------------------------------------------------------------------------

describe('fast-path: already done', () => {
	it('returns immediately when the done flag is set, without touching legacy files', async () => {
		mockMmkvStore.set(MIGRATION_DONE_KEY, true);
		await runMigrationIfNeeded();
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const { openDatabaseAsync } = require('expo-sqlite');
		expect(openDatabaseAsync).not.toHaveBeenCalled();
		expect(isMigrationDone()).toBe(true);
	});

	it('returns immediately when the state JSON phase is done', async () => {
		mockMmkvStore.set(MIGRATION_KEY, JSON.stringify({ schema: 1, phase: 'done', servers: {}, startedAt: 1, updatedAt: 1 }));
		await runMigrationIfNeeded();
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const { openDatabaseAsync } = require('expo-sqlite');
		expect(openDatabaseAsync).not.toHaveBeenCalled();
	});
});

// ---------------------------------------------------------------------------
// Fresh install / no legacy files
// ---------------------------------------------------------------------------

describe('detect: no legacy files', () => {
	it('marks done with phase skipped when default.db does not exist', async () => {
		await runMigrationIfNeeded();
		expect(isMigrationDone()).toBe(true);
		expect(readState()?.phase).toBe('skipped');
	});
});

// ---------------------------------------------------------------------------
// Full port path
// ---------------------------------------------------------------------------

describe('full migration', () => {
	const SERVER_DB = 'open.rocket.chat.db';

	beforeEach(() => {
		_setFileExists(path => path.includes('default.db') || path.includes(SERVER_DB) || path.includes('/uploads/file1'));

		seedLegacyDb('default.db', 'users', [{ id: 'user1', username: 'alice', token: 'tok1', name: 'Alice' }]);
		seedLegacyDb('default.db', 'servers', [
			{ id: 'https://open.rocket.chat', auto_lock: 1, auto_lock_time: 300, last_local_authenticated_session: 9999, biometry: 0 }
		]);
		seedLegacyDb('default.db', 'servers_history', [
			{ id: 'h1', url: 'https://open.rocket.chat', username: 'alice', updated_at: 1000, icon_url: null }
		]);

		seedLegacyDb(SERVER_DB, 'messages', [
			{ id: 'msg1', rid: 'room1', msg: 'hello', status: 1 }, // TEMP — port
			{ id: 'msg2', rid: 'room1', msg: 'world', status: 2 }, // ERROR — port
			{ id: 'msg3', rid: 'room1', msg: 'sent', status: 0 } // SENT — skip
		]);
		seedLegacyDb(SERVER_DB, 'subscriptions', [
			{ id: 'sub1', draft_message: 'my draft' },
			{ id: 'sub2', draft_message: '' }, // skip
			{ id: 'sub3', draft_message: null } // skip
		]);
		seedLegacyDb(SERVER_DB, 'threads', [
			{ id: 'thr1', draft_message: 'thread draft' },
			{ id: 'thr2', draft_message: '' }
		]);
		seedLegacyDb(SERVER_DB, 'uploads', [
			{ id: 'up1', path: '/uploads/file1', rid: 'room1' }, // file exists
			{ id: 'up2', path: '/uploads/file2', rid: 'room1' } // file missing
		]);
		seedLegacyDb(SERVER_DB, 'frequently_used_emojis', [
			{ id: 'emoji1', content: 'wave', extension: 'png', is_custom: 0, count: 5 }
		]);
	});

	it('runs through all phases and marks done', async () => {
		await runMigrationIfNeeded();
		expect(isMigrationDone()).toBe(true);
		expect(readState()?.phase).toBe('done');
	});

	it('ports users to the new servers DB with the token as a bound param', async () => {
		await runMigrationIfNeeded();
		const writes = mockNewDbWrites['default.db'] ?? [];
		const userInsert = writes.find(w => w.sql.includes('INSERT OR REPLACE INTO users'));
		expect(userInsert).toBeDefined();
		expect(userInsert!.args).toContain('user1');
		expect(userInsert!.args).toContain('alice');
		// Token is a bound param — never string-concatenated into SQL
		expect(userInsert!.sql).not.toContain('tok1');
		expect(userInsert!.args).toContain('tok1');
	});

	it('drops legacy-only columns (WMDB _status/_changed and dropped columns) from full-row ports', async () => {
		// Legacy WMDB rows carry _status/_changed on every table, plus columns the new schema removed.
		// A full-row INSERT built from the raw keys would throw "no such column"; insertRows must
		// intersect with the new table's actual columns.
		seedLegacyDb('default.db', 'users', [
			{ id: 'user1', username: 'alice', token: 'tok1', name: 'Alice', _status: 'created', _changed: 'name', legacy_only_col: 'x' }
		]);
		await runMigrationIfNeeded();
		const writes = mockNewDbWrites['default.db'] ?? [];
		const userInsert = writes.find(w => w.sql.includes('INSERT OR REPLACE INTO users'));
		expect(userInsert).toBeDefined();
		expect(userInsert!.sql).not.toContain('_status');
		expect(userInsert!.sql).not.toContain('_changed');
		expect(userInsert!.sql).not.toContain('legacy_only_col');
		// The business columns still make it through, as bound params
		expect(userInsert!.args).toContain('user1');
		expect(userInsert!.args).toContain('alice');
		expect(userInsert!.args).not.toContain('x');
	});

	it('ports server lock fields without clobbering server-synced columns', async () => {
		await runMigrationIfNeeded();
		const writes = mockNewDbWrites['default.db'] ?? [];
		const lockUpdate = writes.find(w => w.sql.includes('UPDATE servers SET') && w.sql.includes('auto_lock'));
		expect(lockUpdate).toBeDefined();
		expect(lockUpdate!.args).toEqual([1, 300, 9999, 0, 'https://open.rocket.chat']);
	});

	it('ports only status 1 and 2 messages', async () => {
		await runMigrationIfNeeded();
		const writes = mockNewDbWrites[SERVER_DB] ?? [];
		const msgInserts = writes.filter(w => w.sql.includes('INSERT OR REPLACE INTO messages'));
		const ids = msgInserts.flatMap(w => w.args).filter(v => typeof v === 'string' && v.startsWith('msg'));
		expect(ids).toContain('msg1');
		expect(ids).toContain('msg2');
		expect(ids).not.toContain('msg3');
	});

	it('ports only non-empty subscription drafts', async () => {
		await runMigrationIfNeeded();
		const writes = mockNewDbWrites[SERVER_DB] ?? [];
		const draftUpdates = writes.filter(w => w.sql.includes('draft_message') && w.sql.includes('subscriptions'));
		const sub1Update = draftUpdates.find(w => w.args.includes('sub1'));
		const sub2Update = draftUpdates.find(w => w.args.includes('sub2'));
		expect(sub1Update).toBeDefined();
		expect(sub2Update).toBeUndefined();
		expect(sub1Update!.args).toContain('my draft');
	});

	it('ports only uploads whose file exists', async () => {
		await runMigrationIfNeeded();
		const writes = mockNewDbWrites[SERVER_DB] ?? [];
		const uploadInserts = writes.filter(w => w.sql.includes('INSERT OR REPLACE INTO uploads'));
		const ids = uploadInserts.flatMap(w => w.args).filter(v => typeof v === 'string' && v.startsWith('up'));
		expect(ids).toContain('up1');
		expect(ids).not.toContain('up2');
	});

	it('ports frequently_used_emojis', async () => {
		await runMigrationIfNeeded();
		const writes = mockNewDbWrites[SERVER_DB] ?? [];
		const emojiInsert = writes.find(w => w.sql.includes('INSERT OR REPLACE INTO frequently_used_emojis'));
		expect(emojiInsert).toBeDefined();
		expect(emojiInsert!.args).toContain('emoji1');
	});

	it('wipes every legacy file after porting', async () => {
		await runMigrationIfNeeded();
		expect(mockDeletedDbs).toContain(SERVER_DB);
		expect(mockDeletedDbs).toContain('default.db');
	});
});

// ---------------------------------------------------------------------------
// Secure delete — main file + WAL/SHM sidecars
// ---------------------------------------------------------------------------

describe('secure delete', () => {
	const SERVER_DB = 'open.rocket.chat.db';

	beforeEach(() => {
		_setFileExists(path => path.includes('default.db') || path.includes(SERVER_DB));
		seedLegacyDb('default.db', 'users', []);
		seedLegacyDb('default.db', 'servers', [{ id: 'https://open.rocket.chat' }]);
		seedLegacyDb('default.db', 'servers_history', []);
		for (const t of ['messages', 'subscriptions', 'threads', 'uploads', 'frequently_used_emojis']) {
			seedLegacyDb(SERVER_DB, t, []);
		}
		// Simulate WAL/SHM sidecars left on disk next to each legacy DB
		for (const db of [SERVER_DB, 'default.db']) {
			mockExistingFiles.add(`${mockLegacyDir}/${db}-wal`);
			mockExistingFiles.add(`${mockLegacyDir}/${db}-shm`);
		}
	});

	it('deletes WAL and SHM sidecars alongside each main DB file', async () => {
		await runMigrationIfNeeded();
		for (const db of [SERVER_DB, 'default.db']) {
			expect(mockDeletedDbs).toContain(db);
			expect(mockDeletedFiles).toContain(`${mockLegacyDir}/${db}-wal`);
			expect(mockDeletedFiles).toContain(`${mockLegacyDir}/${db}-shm`);
		}
	});
});

// ---------------------------------------------------------------------------
// Drafts never clobber server-synced columns
// ---------------------------------------------------------------------------

describe('draft port preserves server columns', () => {
	const SERVER_DB = 'open.rocket.chat.db';

	beforeEach(() => {
		_setFileExists(path => path.includes('default.db') || path.includes(SERVER_DB));
		seedLegacyDb('default.db', 'users', []);
		seedLegacyDb('default.db', 'servers', [{ id: 'https://open.rocket.chat' }]);
		seedLegacyDb('default.db', 'servers_history', []);
		seedLegacyDb(SERVER_DB, 'messages', []);
		seedLegacyDb(SERVER_DB, 'subscriptions', [{ id: 'sub1', draft_message: 'unsent text' }]);
		seedLegacyDb(SERVER_DB, 'threads', [{ id: 'thr1', draft_message: 'thread unsent' }]);
		seedLegacyDb(SERVER_DB, 'uploads', []);
		seedLegacyDb(SERVER_DB, 'frequently_used_emojis', []);
	});

	it('writes subscription drafts via INSERT OR IGNORE + UPDATE, never INSERT OR REPLACE', async () => {
		await runMigrationIfNeeded();
		const writes = mockNewDbWrites[SERVER_DB] ?? [];
		const subWrites = writes.filter(w => w.sql.includes('subscriptions'));
		// Only the draft column is touched — a full-row REPLACE would null the columns the server later syncs
		expect(subWrites.some(w => w.sql.includes('INSERT OR REPLACE INTO subscriptions'))).toBe(false);
		expect(subWrites.some(w => w.sql.includes('INSERT OR IGNORE INTO subscriptions'))).toBe(true);
		const draftUpdate = subWrites.find(w => w.sql.includes('UPDATE subscriptions SET draft_message'));
		expect(draftUpdate!.args).toEqual(['unsent text', 'sub1']);
	});

	it('writes thread drafts via INSERT OR IGNORE + UPDATE, never INSERT OR REPLACE', async () => {
		await runMigrationIfNeeded();
		const writes = mockNewDbWrites[SERVER_DB] ?? [];
		const threadWrites = writes.filter(w => w.sql.includes('threads'));
		expect(threadWrites.some(w => w.sql.includes('INSERT OR REPLACE INTO threads'))).toBe(false);
		expect(threadWrites.some(w => w.sql.includes('INSERT OR IGNORE INTO threads'))).toBe(true);
		const draftUpdate = threadWrites.find(w => w.sql.includes('UPDATE threads SET draft_message'));
		expect(draftUpdate!.args).toEqual(['thread unsent', 'thr1']);
	});
});

// ---------------------------------------------------------------------------
// Crash-resume
// ---------------------------------------------------------------------------

describe('crash-resume', () => {
	it('resumes at porting_active without re-porting the servers DB', async () => {
		const SERVER_DB = 'open.rocket.chat.db';
		_setFileExists(path => path.includes('default.db') || path.includes(SERVER_DB));
		seedLegacyDb('default.db', 'users', [{ id: 'u1', username: 'bob' }]);
		seedLegacyDb('default.db', 'servers', [{ id: 'https://open.rocket.chat' }]);
		seedLegacyDb('default.db', 'servers_history', []);
		seedLegacyDb(SERVER_DB, 'messages', []);
		seedLegacyDb(SERVER_DB, 'subscriptions', []);
		seedLegacyDb(SERVER_DB, 'threads', []);
		seedLegacyDb(SERVER_DB, 'uploads', []);
		seedLegacyDb(SERVER_DB, 'frequently_used_emojis', []);

		// Simulate a crash after porting_servers: state persisted at porting_active
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

		await runMigrationIfNeeded();

		expect(isMigrationDone()).toBe(true);
		// The servers DB must not be written during a porting_active resume
		const serverDbWrites = mockNewDbWrites['default.db'] ?? [];
		expect(serverDbWrites.length).toBe(0);
		expect(readState()?.servers['https://open.rocket.chat']).toBe('wiped');
	});
});

// ---------------------------------------------------------------------------
// Idempotency
// ---------------------------------------------------------------------------

describe('idempotency', () => {
	it('skips on a second run once legacy files are gone', async () => {
		_setFileExists(path => path.includes('default.db'));
		seedLegacyDb('default.db', 'users', [{ id: 'u1', username: 'carol' }]);
		seedLegacyDb('default.db', 'servers', []);
		seedLegacyDb('default.db', 'servers_history', []);

		await runMigrationIfNeeded();
		expect(isMigrationDone()).toBe(true);

		// Re-run from scratch: state cleared, legacy files wiped → detect finds nothing → skipped
		mockMmkvStore.clear();
		for (const k of Object.keys(mockNewDbWrites)) delete mockNewDbWrites[k];
		for (const k of Object.keys(mockNewSqliteMocks)) delete mockNewSqliteMocks[k];
		mockDeletedDbs.length = 0;
		_clearRegistry();
		_setFileExists(() => false);

		await runMigrationIfNeeded();
		expect(isMigrationDone()).toBe(true);
		const secondRunWrites = Object.values(mockNewDbWrites).flat().length;
		expect(secondRunWrites).toBe(0);
	});
});
