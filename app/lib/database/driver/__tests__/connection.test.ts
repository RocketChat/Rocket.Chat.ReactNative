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

import { deriveServerDbName, openServersDb, openServerDb, closeDb, _clearRegistry, _getRegistry, DEFAULT_DB_NAME } from '../connection';

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

jest.mock('expo-file-system', () => ({
	Paths: {
		appleSharedContainers: {
			'group.ios.chat.rocket': { uri: '/fake/app-group/' }
		}
	}
}));

jest.mock('../keyService', () => ({
	getOrCreateDatabaseKey: jest.fn(async (_name: string) => 'a'.repeat(64)),
	deleteDatabaseKey: jest.fn(async () => {})
}));

// drizzle-orm/expo-sqlite — stub out Drizzle wrapping (we only test connection logic)
jest.mock('drizzle-orm/expo-sqlite', () => ({
	drizzle: jest.fn(() => ({}))
}));

// React Native Platform
jest.mock('react-native', () => ({
	Platform: { OS: 'ios' }
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

import { openDatabaseAsync } from 'expo-sqlite';
import { getOrCreateDatabaseKey } from '../keyService';

beforeEach(() => {
	execCalls.length = 0;
	verifyFails = false;
	_clearRegistry();
	jest.clearAllMocks();
	// Restore defaults after clearAllMocks
	(openDatabaseAsync as jest.Mock).mockResolvedValue(mockSqlite);
	(getOrCreateDatabaseKey as jest.Mock).mockResolvedValue('a'.repeat(64));
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
	it('applies PRAGMA key before busy_timeout before WAL', async () => {
		await openServersDb();

		const keyIdx = execCalls.findIndex(s => s.includes('PRAGMA key'));
		const busyIdx = execCalls.findIndex(s => s.includes('busy_timeout'));
		const walIdx = execCalls.findIndex(s => s.includes('journal_mode'));

		expect(keyIdx).toBeGreaterThanOrEqual(0);
		expect(busyIdx).toBeGreaterThan(keyIdx);
		expect(walIdx).toBeGreaterThan(busyIdx);
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
