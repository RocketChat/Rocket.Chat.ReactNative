import { getOrCreateDatabaseKey } from '../keyStore';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetItem = jest.fn<Promise<string | null>, [string]>();
const mockSetItem = jest.fn<Promise<void>, [string, string]>();

jest.mock('../../native/NativeDatabaseKeyStore', () => ({
	__esModule: true,
	default: {
		getItem: (...args: [string]) => mockGetItem(...args),
		setItem: (...args: [string, string]) => mockSetItem(...args),
		removeItem: jest.fn()
	}
}));

jest.mock('@rocket.chat/mobile-crypto', () => ({
	randomKey: jest.fn(async () => 'a'.repeat(64))
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('getOrCreateDatabaseKey', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockSetItem.mockResolvedValue(undefined);
	});

	it('returns the existing key unchanged when one is stored', async () => {
		const existingKey = 'b'.repeat(64);
		mockGetItem.mockResolvedValueOnce(existingKey);

		const result = await getOrCreateDatabaseKey('test.db');

		expect(result).toBe(existingKey);
		expect(result).toMatch(/^[0-9a-f]{64}$/i);
		expect(mockSetItem).not.toHaveBeenCalled();
	});

	it('mints a 64-char hex key, stores it, and returns it when none exists', async () => {
		mockGetItem.mockResolvedValueOnce(null);

		const result = await getOrCreateDatabaseKey('new.db');

		expect(typeof result).toBe('string');
		expect(result).toHaveLength(64);
		expect(result).toMatch(/^[0-9a-f]{64}$/i);
		expect(mockSetItem).toHaveBeenCalledTimes(1);
		expect(mockSetItem).toHaveBeenCalledWith('db_key_v1:new.db', result);
	});

	it('propagates a read error and does NOT call setItem (fail-closed)', async () => {
		const readError = Object.assign(new Error('Keychain read failed'), { code: 'KEYCHAIN_READ_ERROR' });
		mockGetItem.mockRejectedValueOnce(readError);

		await expect(getOrCreateDatabaseKey('encrypted.db')).rejects.toThrow('Keychain read failed');
		expect(mockSetItem).not.toHaveBeenCalled();
	});

	it('treats resolved null as not-found and mints a new key', async () => {
		mockGetItem.mockResolvedValueOnce(null);

		const result = await getOrCreateDatabaseKey('absent.db');

		expect(mockSetItem).toHaveBeenCalledTimes(1);
		expect(result).toHaveLength(64);
	});

	it('throws on undefined (contract violation) and does NOT call setItem', async () => {
		mockGetItem.mockResolvedValueOnce(undefined as unknown as null);

		await expect(getOrCreateDatabaseKey('undef.db')).rejects.toThrow('unexpected value');
		expect(mockSetItem).not.toHaveBeenCalled();
	});

	it('rejects a malformed stored key (fail-closed) and does NOT mint', async () => {
		mockGetItem.mockResolvedValueOnce('z'.repeat(64)); // 64 chars but not hex

		await expect(getOrCreateDatabaseKey('corrupt.db')).rejects.toThrow('malformed');
		expect(mockSetItem).not.toHaveBeenCalled();
	});
});
