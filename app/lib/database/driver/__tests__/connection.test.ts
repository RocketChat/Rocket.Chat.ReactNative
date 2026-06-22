/**
 * Connection lifecycle tests — L1 (Jest, mocked expo-sqlite and keyService).
 *
 * Covers:
 *  - deriveServerDbName: strips scheme, replaces slashes, single .db suffix
 *  - open-sequence ordering: PRAGMA key is first, busy_timeout second, WAL third
 *  - registry: same handle returned on second open, no duplicate opens
 *  - closeDb: removes from registry; next open re-runs full sequence
 *  - open-verify failure: safe error message, no key material
 */

import {
	deriveServerDbName,
	openServersDb,
	openServerDb,
	closeDb,
	_clearRegistry,
	_getRegistry,
	DEFAULT_DB_NAME
} from '../connection';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// expo-sqlite mock — records calls to execAsync in order so we can assert PRAGMA ordering
const execCalls: string[] = [];
let verifyFails = false;

const mockSqlite = {
	execAsync: jest.fn(async (sql: string) => {
		execCalls.push(sql);
	}),
	getFirstAsync: jest.fn(async (_sql: string) => {
		if (verifyFails) throw new Error('file is not a database');
		return { count: 0 };
	}),
	closeAsync: jest.fn(async () => {}),
	// Minimal stub for drizzle to accept — drizzle-orm/expo-sqlite wraps the raw client
	execSync: jest.fn(),
	runAsync: jest.fn(async () => ({ changes: 0, lastInsertRowId: 0 })),
	getAllAsync: jest.fn(async () => []),
	getFirstSync: jest.fn(() => null),
	getAllSync: jest.fn(() => [])
};

jest.mock('expo-sqlite', () => ({
	openDatabaseAsync: jest.fn(async (_name: string, _opts?: unknown, _dir?: string) => mockSqlite),
	deleteDatabaseAsync: jest.fn(async () => {}),
	addDatabaseChangeListener: jest.fn(() => ({ remove: jest.fn() }))
}));

const createdDirs: string[] = [];

jest.mock('expo-file-system', () => ({
	Paths: {
		appleSharedContainers: {
			'group.ios.chat.rocket': { uri: '/fake/app-group/' }
		}
	},
	// Minimal Directory stub: joins uris like the real constructor and records create() calls
	Directory: class {
		uri: string;
		exists = false;
		constructor(...uris: string[]) {
			this.uri = uris.join('/').replace(/\/+/g, '/');
		}
		create() {
			createdDirs.push(this.uri);
		}
	}
}));

jest.mock('../keyService', () => ({
	getOrCreateDatabaseKey: jest.fn(async (_name: string) => 'a'.repeat(64)),
	getOrCreateDatabaseSalt: jest.fn(async (_name: string) => 'b'.repeat(32)),
	deleteDatabaseKey: jest.fn(async () => {})
}));

// drizzle-orm/expo-sqlite — stub out Drizzle wrapping (we only test connection logic)
jest.mock('drizzle-orm/expo-sqlite', () => ({
	drizzle: jest.fn(() => ({}))
}));

// Migrator — DDL application is covered on-device; here we only assert the open sequence
jest.mock('drizzle-orm/expo-sqlite/migrator', () => ({
	migrate: jest.fn(async () => {})
}));

// React Native Platform
jest.mock('react-native', () => ({
	Platform: { OS: 'ios' }
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

import { openDatabaseAsync } from 'expo-sqlite';
import { getOrCreateDatabaseKey, getOrCreateDatabaseSalt } from '../keyService';

beforeEach(() => {
	execCalls.length = 0;
	verifyFails = false;
	_clearRegistry();
	jest.clearAllMocks();
	// Restore defaults after clearAllMocks
	(openDatabaseAsync as jest.Mock).mockResolvedValue(mockSqlite);
	(getOrCreateDatabaseKey as jest.Mock).mockResolvedValue('a'.repeat(64));
	(getOrCreateDatabaseSalt as jest.Mock).mockResolvedValue('b'.repeat(32));
	mockSqlite.execAsync.mockImplementation(async (sql: string) => {
		execCalls.push(sql);
	});
	mockSqlite.getFirstAsync.mockImplementation(async () => {
		if (verifyFails) throw new Error('file is not a database');
		return { count: 0 };
	});
	mockSqlite.closeAsync.mockResolvedValue(undefined);
});

// ---------------------------------------------------------------------------
// deriveServerDbName
// ---------------------------------------------------------------------------

describe('deriveServerDbName', () => {
	it('strips https scheme and replaces slashes with dots', () => {
		expect(deriveServerDbName('https://open.rocket.chat')).toBe('open.rocket.chat.db');
	});

	it('strips http scheme', () => {
		expect(deriveServerDbName('http://localhost:3000')).toBe('localhost:3000.db');
	});

	it('trims trailing slashes before munging', () => {
		expect(deriveServerDbName('https://open.rocket.chat/')).toBe('open.rocket.chat.db');
		expect(deriveServerDbName('https://open.rocket.chat//')).toBe('open.rocket.chat.db');
	});

	it('produces a single .db suffix (no .db.db doubling)', () => {
		const name = deriveServerDbName('https://my.server.com');
		expect(name.endsWith('.db')).toBe(true);
		expect(name.endsWith('.db.db')).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// Open sequence ordering
// ---------------------------------------------------------------------------

describe('open sequence', () => {
	it('applies PRAGMA key, then cipher header + salt, then busy_timeout, then WAL — in one execAsync call', async () => {
		await openServersDb();

		// All 5 PRAGMAs are sent in a single multi-statement execAsync call.
		expect(execCalls).toHaveLength(1);
		const call = execCalls[0];
		const keyPos = call.indexOf('PRAGMA key');
		const headerPos = call.indexOf('cipher_plaintext_header_size');
		const saltPos = call.indexOf('cipher_salt');
		const busyPos = call.indexOf('busy_timeout');
		const walPos = call.indexOf('journal_mode');

		expect(keyPos).toBeGreaterThanOrEqual(0);
		expect(headerPos).toBeGreaterThan(keyPos);
		expect(saltPos).toBeGreaterThan(headerPos);
		expect(busyPos).toBeGreaterThan(saltPos);
		expect(walPos).toBeGreaterThan(busyPos);
	});

	it('sets cipher_plaintext_header_size = 32', async () => {
		await openServersDb();
		expect(execCalls.some(s => s.includes('cipher_plaintext_header_size = 32'))).toBe(true);
	});

	it('includes the raw-salt x-hex form in the cipher_salt statement', async () => {
		await openServersDb();
		const pragmaSalt = execCalls.find(s => s.includes('cipher_salt'));
		expect(pragmaSalt).toMatch(/PRAGMA cipher_salt = "x'/);
		expect(pragmaSalt).toMatch(/[0-9a-fA-F]{32}/);
	});

	it('includes the raw-key x-hex form in the PRAGMA key statement', async () => {
		await openServersDb();
		const pragmaKey = execCalls.find(s => s.includes('PRAGMA key'));
		expect(pragmaKey).toMatch(/PRAGMA key = "x'/);
		expect(pragmaKey).toMatch(/[0-9a-fA-F]{64}/);
	});

	it('sets busy_timeout = 500', async () => {
		await openServersDb();
		expect(execCalls.some(s => s.includes('busy_timeout = 500'))).toBe(true);
	});

	it('sets journal_mode = WAL', async () => {
		await openServersDb();
		expect(execCalls.some(s => s.toLowerCase().includes('journal_mode = wal'))).toBe(true);
	});

	it('fetches the key before opening the database', async () => {
		const callOrder: string[] = [];
		(getOrCreateDatabaseKey as jest.Mock).mockImplementation(async () => {
			callOrder.push('key');
			return 'a'.repeat(64);
		});
		(openDatabaseAsync as jest.Mock).mockImplementation(async () => {
			callOrder.push('open');
			return mockSqlite;
		});

		await openServerDb('https://example.com');
		expect(callOrder.indexOf('key')).toBeLessThan(callOrder.indexOf('open'));
	});
});

// ---------------------------------------------------------------------------
// iOS directory isolation (Slice 0 — collision fix)
// ---------------------------------------------------------------------------

describe('iOS directory isolation', () => {
	it('creates and opens DBs in the App Group SQLite subdirectory, not the container root', async () => {
		// resolved once at module load — proves new DBs avoid the legacy plaintext files at the root
		expect(createdDirs).toContain('/fake/app-group/SQLite');

		await openServersDb();
		const [, , dir] = (openDatabaseAsync as jest.Mock).mock.calls[0];
		expect(dir).toBe('/fake/app-group/SQLite');
	});
});

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

describe('registry', () => {
	it('returns the cached handle on a second open (no duplicate openDatabaseAsync)', async () => {
		const h1 = await openServersDb();
		const h2 = await openServersDb();
		expect(h1).toBe(h2);
		expect(openDatabaseAsync).toHaveBeenCalledTimes(1);
	});

	it('registers different handles for different server URLs', async () => {
		const h1 = await openServerDb('https://server-a.com');
		const h2 = await openServerDb('https://server-b.com');
		expect(h1).not.toBe(h2);
	});

	it('closeDb removes the entry so the next open re-runs the sequence', async () => {
		await openServersDb();
		await closeDb(DEFAULT_DB_NAME);
		expect(_getRegistry().has(DEFAULT_DB_NAME)).toBe(false);
		await openServersDb();
		expect(openDatabaseAsync).toHaveBeenCalledTimes(2);
	});
});

// ---------------------------------------------------------------------------
// Open-verify failure
// ---------------------------------------------------------------------------

describe('open-verify failure', () => {
	it('throws a safe error when verify fails', async () => {
		verifyFails = true;
		await expect(openServersDb()).rejects.toThrow('database open-verify failed');
	});

	it('error message contains no key material', async () => {
		verifyFails = true;
		let err: Error | undefined;
		try {
			await openServersDb();
		} catch (e) {
			err = e as Error;
		}
		expect(err!.message).not.toMatch(/[0-9a-fA-F]{32,}/);
	});
});
