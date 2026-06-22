import { Platform } from 'react-native';

import { dbFileUri, serverUrlToDbName, statFileBytes, collectDbSizes, runDbMigrationProbe } from './dbMigrationProbe';

// ── mocks ────────────────────────────────────────────────────────────────────

jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));

const mockGetInfoAsync = jest.fn();
jest.mock('expo-file-system/legacy', () => ({
	getInfoAsync: (...args: unknown[]) => mockGetInfoAsync(...args),
	documentDirectory: 'file:///data/user/0/chat.rocket.android/files/'
}));

const mockLogEvent = jest.fn();
jest.mock('./helpers/log', () => ({
	logEvent: (...args: unknown[]) => mockLogEvent(...args),
	events: { DB_MIGRATION_PROBE: 'db_migration_probe' }
}));

jest.mock('./appGroup', () => ({ appGroupPath: '' }));

const mockGetBool = jest.fn();
const mockSetBool = jest.fn();
jest.mock('./userPreferences', () => ({
	__esModule: true,
	default: { getBool: (...args: unknown[]) => mockGetBool(...args), setBool: (...args: unknown[]) => mockSetBool(...args) }
}));

const mockServersGet = jest.fn();
jest.mock('../database', () => ({
	__esModule: true,
	default: { servers: { get: (...args: unknown[]) => mockServersGet(...args) } }
}));

const mockGetModel = jest.fn(() => 'Pixel 7');
const mockGetSystemName = jest.fn(() => 'Android');
const mockGetSystemVersion = jest.fn(() => '14');
const mockGetFreeDiskStorage = jest.fn(() => Promise.resolve(10 * 1024 * 1024 * 1024)); // 10 GB
jest.mock('react-native-device-info', () => ({
	__esModule: true,
	default: {
		getModel: () => mockGetModel(),
		getSystemName: () => mockGetSystemName(),
		getSystemVersion: () => mockGetSystemVersion(),
		getFreeDiskStorage: () => mockGetFreeDiskStorage()
	}
}));

// ── helpers ───────────────────────────────────────────────────────────────────

function makeServerCollection(ids: string[]) {
	const records = ids.map(id => ({ id }));
	return { query: () => ({ fetch: () => Promise.resolve(records) }) };
}

beforeEach(() => {
	jest.clearAllMocks();
	(Platform as any).OS = 'android';
	mockGetBool.mockReturnValue(null);
});

// ── dbFileUri ─────────────────────────────────────────────────────────────────

describe('dbFileUri', () => {
	it('constructs android URI with double .db suffix', () => {
		(Platform as any).OS = 'android';
		expect(dbFileUri('default.db')).toBe('file:///data/user/0/chat.rocket.android/default.db.db');
	});

	it('constructs ios URI from absolute appGroupPath', () => {
		(Platform as any).OS = 'ios';
		expect(dbFileUri('/private/var/mobile/Containers/Shared/AppGroup/ABC/default.db')).toBe(
			'file:///private/var/mobile/Containers/Shared/AppGroup/ABC/default.db'
		);
	});
});

// ── serverUrlToDbName ─────────────────────────────────────────────────────────

describe('serverUrlToDbName', () => {
	it('strips protocol and replaces slashes', () => {
		expect(serverUrlToDbName('https://open.rocket.chat')).toBe('open.rocket.chat.db');
	});

	it('handles URLs with a path segment', () => {
		expect(serverUrlToDbName('https://example.com/sub')).toBe('example.com.sub.db');
	});
});

// ── statFileBytes ─────────────────────────────────────────────────────────────

describe('statFileBytes', () => {
	it('returns size when file exists', async () => {
		mockGetInfoAsync.mockResolvedValue({ exists: true, size: 4096 });
		expect(await statFileBytes('file:///foo.db')).toBe(4096);
	});

	it('returns null when file does not exist', async () => {
		mockGetInfoAsync.mockResolvedValue({ exists: false });
		expect(await statFileBytes('file:///missing.db')).toBeNull();
	});

	it('returns null when getInfoAsync throws', async () => {
		mockGetInfoAsync.mockRejectedValue(new Error('permission denied'));
		expect(await statFileBytes('file:///bad.db')).toBeNull();
	});
});

// ── collectDbSizes ────────────────────────────────────────────────────────────

describe('collectDbSizes', () => {
	it('sums serversDb + all server DBs when all stats succeed', async () => {
		mockGetInfoAsync.mockResolvedValue({ exists: true, size: 1000 });
		mockServersGet.mockReturnValue(makeServerCollection(['https://a.com', 'https://b.com']));

		const result = await collectDbSizes();

		// serversDb (1000) + a.com (1000) + b.com (1000)
		expect(result.serversDbBytes).toBe(1000);
		expect(result.totalBytes).toBe(3000);
	});

	it('sets totalBytes to null when any server DB stat fails', async () => {
		mockGetInfoAsync
			.mockResolvedValueOnce({ exists: true, size: 500 }) // serversDb
			.mockResolvedValueOnce({ exists: true, size: 200 }) // first server
			.mockResolvedValueOnce({ exists: false }); // second server missing
		mockServersGet.mockReturnValue(makeServerCollection(['https://a.com', 'https://b.com']));

		const result = await collectDbSizes();

		expect(result.serversDbBytes).toBe(500);
		expect(result.totalBytes).toBeNull();
	});

	it('sets totalBytes to null when server query throws', async () => {
		mockGetInfoAsync.mockResolvedValue({ exists: true, size: 800 });
		mockServersGet.mockReturnValue({
			query: () => ({ fetch: () => Promise.reject(new Error('db error')) })
		});

		const result = await collectDbSizes();

		expect(result.serversDbBytes).toBe(800);
		expect(result.totalBytes).toBeNull();
	});

	it('reports serversDbBytes even when it is null', async () => {
		mockGetInfoAsync.mockResolvedValue({ exists: false });
		mockServersGet.mockReturnValue(makeServerCollection([]));

		const result = await collectDbSizes();

		expect(result.serversDbBytes).toBeNull();
		expect(result.totalBytes).toBe(0); // 0 servers, serversDb null treated as 0
	});
});

// ── runDbMigrationProbe ───────────────────────────────────────────────────────

describe('runDbMigrationProbe', () => {
	beforeEach(() => {
		mockGetInfoAsync.mockResolvedValue({ exists: true, size: 2048 });
		mockServersGet.mockReturnValue(makeServerCollection(['https://open.rocket.chat']));
	});

	it('fires the analytics event with correct payload on first run', async () => {
		mockGetBool.mockReturnValue(null);

		await runDbMigrationProbe();

		expect(mockLogEvent).toHaveBeenCalledWith('db_migration_probe', {
			device_model: 'Pixel 7',
			os_name: 'Android',
			os_version: '14',
			free_disk_mb: 10 * 1024, // 10 GB → 10240 MB
			servers_db_bytes: 2048,
			total_db_bytes: 4096 // serversDb + one server DB
		});
		expect(mockSetBool).toHaveBeenCalledWith('db_migration_probe_v1', true);
	});

	it('does not fire when guard flag is already set', async () => {
		mockGetBool.mockReturnValue(true);

		await runDbMigrationProbe();

		expect(mockLogEvent).not.toHaveBeenCalled();
		expect(mockSetBool).not.toHaveBeenCalled();
	});

	it('does not throw or set the flag when logEvent throws', async () => {
		mockGetBool.mockReturnValue(null);
		mockLogEvent.mockImplementation(() => {
			throw new Error('analytics unavailable');
		});

		await expect(runDbMigrationProbe()).resolves.toBeUndefined();
		expect(mockSetBool).not.toHaveBeenCalled();
	});
});
