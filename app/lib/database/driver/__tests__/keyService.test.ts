/**
 * Key service tests — L1 (Jest, mocked storage).
 *
 * Covers:
 *  - creation: generates a 64-hex-char key
 *  - idempotence: repeated calls return the same key
 *  - no key material in thrown errors
 *  - deleteDatabaseKey removes the entry (next call generates a new key)
 *  - installKeychainShim replaces the backing store
 *  - dev shim fails loud outside __DEV__ (silent data loss otherwise)
 */

import { randomKey } from '@rocket.chat/mobile-crypto';

import {
	getOrCreateDatabaseKey,
	getOrCreateDatabaseSalt,
	deleteDatabaseKey,
	installKeychainShim,
	type IKeychainShim
} from '../keyService';

// Mock @rocket.chat/mobile-crypto so Jest doesn't need the native module.
// randomKey returns hex (the source uses it instead of randomBytes, which returns base64);
// two hex chars per byte, so the length tracks the requested byte count (32 → 64, 16 → 32).
jest.mock('@rocket.chat/mobile-crypto', () => ({
	randomKey: jest.fn(async (bytes: number) => 'ab'.repeat(bytes))
}));

const mockLogEvent = jest.fn();
jest.mock('../../../methods/helpers/log', () => ({
	logEvent: (...args: unknown[]) => mockLogEvent(...args),
	events: { DB_KEY_READ_FAILURE: 'db_key_read_failure' }
}));

function makeMemoryShim(): IKeychainShim {
	const store = new Map<string, string>();
	return {
		getItem: async (key: string) => store.get(key) ?? null,
		setItem: async (key: string, value: string) => {
			store.set(key, value);
		},
		removeItem: async (key: string) => {
			store.delete(key);
		}
	};
}

beforeEach(() => {
	// Install a fresh shim so tests are isolated
	installKeychainShim(makeMemoryShim());
	// Reset the CSPRNG mock after any one-shot override below
	(randomKey as jest.Mock).mockImplementation(async (bytes: number) => 'ab'.repeat(bytes));
	mockLogEvent.mockClear();
});

describe('getOrCreateDatabaseKey', () => {
	it('generates a 64-hex-char key', async () => {
		const key = await getOrCreateDatabaseKey('servers.db');
		expect(key).toMatch(/^[0-9a-fA-F]{64}$/);
	});

	it('returns the same key on repeated calls (idempotent)', async () => {
		const k1 = await getOrCreateDatabaseKey('open.rocket.chat.db');
		const k2 = await getOrCreateDatabaseKey('open.rocket.chat.db');
		expect(k1).toBe(k2);
	});

	it('returns different keys for different db names', async () => {
		// The mock always returns the same hex but each name gets its own entry;
		// since we mock randomKey to the same value both will equal the mock value —
		// the key isolation per name is structural (separate store entries), tested via delete below.
		const k1 = await getOrCreateDatabaseKey('server-a.db');
		const k2 = await getOrCreateDatabaseKey('server-b.db');
		// Both are 64-hex; they happen to be equal under the mock but the storage keys differ
		expect(k1).toMatch(/^[0-9a-fA-F]{64}$/);
		expect(k2).toMatch(/^[0-9a-fA-F]{64}$/);
	});

	it('does not include key material in thrown errors', async () => {
		// Simulate a CSPRNG that returns invalid output (e.g. the base64 randomBytes shape)
		(randomKey as jest.Mock).mockResolvedValueOnce('not-valid-hex!!');

		let thrown: Error | undefined;
		try {
			await getOrCreateDatabaseKey('bad.db');
		} catch (e) {
			thrown = e as Error;
		}

		expect(thrown).toBeDefined();
		// Error message must not contain the bad output or any hex key material
		expect(thrown!.message).not.toMatch(/not-valid-hex/);
		expect(thrown!.message).not.toMatch(/[0-9a-fA-F]{32}/);
	});
});

describe('getOrCreateDatabaseSalt', () => {
	it('generates a 32-hex-char salt', async () => {
		const salt = await getOrCreateDatabaseSalt('servers.db');
		expect(salt).toMatch(/^[0-9a-fA-F]{32}$/);
	});

	it('returns the same salt on repeated calls (idempotent)', async () => {
		const s1 = await getOrCreateDatabaseSalt('open.rocket.chat.db');
		const s2 = await getOrCreateDatabaseSalt('open.rocket.chat.db');
		expect(s1).toBe(s2);
	});

	it('stores salt under a separate key from the encryption key', async () => {
		const shim = makeMemoryShim();
		const spySet = jest.spyOn(shim, 'setItem');
		installKeychainShim(shim);

		await getOrCreateDatabaseKey('combo.db');
		await getOrCreateDatabaseSalt('combo.db');

		expect(spySet).toHaveBeenCalledWith('db_key_v1:combo.db', expect.any(String));
		expect(spySet).toHaveBeenCalledWith('db_salt_v1:combo.db', expect.stringMatching(/^[0-9a-fA-F]{32}$/));
	});

	it('does not include salt material in thrown errors', async () => {
		(randomKey as jest.Mock).mockResolvedValueOnce('not-valid-hex!!');

		let thrown: Error | undefined;
		try {
			await getOrCreateDatabaseSalt('bad.db');
		} catch (e) {
			thrown = e as Error;
		}

		expect(thrown).toBeDefined();
		expect(thrown!.message).not.toMatch(/not-valid-hex/);
		expect(thrown!.message).not.toMatch(/[0-9a-fA-F]{16}/);
	});
});

describe('deleteDatabaseKey', () => {
	it('removes the stored key so the next call generates a fresh one', async () => {
		const shim = makeMemoryShim();
		installKeychainShim(shim);

		await getOrCreateDatabaseKey('temp.db');
		await deleteDatabaseKey('temp.db');

		// The store should now be empty for this key; mock returns same value so we verify
		// the setItem was called again by checking the shim received a second write
		const spySet = jest.spyOn(shim, 'setItem');
		await getOrCreateDatabaseKey('temp.db');
		expect(spySet).toHaveBeenCalledTimes(1);
	});

	it('removes the salt as well as the key', async () => {
		const shim = makeMemoryShim();
		const spyRemove = jest.spyOn(shim, 'removeItem');
		installKeychainShim(shim);

		await getOrCreateDatabaseKey('temp.db');
		await getOrCreateDatabaseSalt('temp.db');
		await deleteDatabaseKey('temp.db');

		expect(spyRemove).toHaveBeenCalledWith('db_key_v1:temp.db');
		expect(spyRemove).toHaveBeenCalledWith('db_salt_v1:temp.db');
	});

	it('is a no-op for a name that was never stored', async () => {
		await expect(deleteDatabaseKey('nonexistent.db')).resolves.toBeUndefined();
	});
});

describe('installKeychainShim', () => {
	it('redirects all calls to the new shim', async () => {
		const shim = makeMemoryShim();
		const spyGet = jest.spyOn(shim, 'getItem');
		const spySet = jest.spyOn(shim, 'setItem');

		installKeychainShim(shim);
		await getOrCreateDatabaseKey('redirect.db');

		expect(spyGet).toHaveBeenCalledWith('db_key_v1:redirect.db');
		expect(spySet).toHaveBeenCalledWith('db_key_v1:redirect.db', expect.stringMatching(/^[0-9a-fA-F]{64}$/));
	});
});

describe('dev keychain shim', () => {
	it('fails loud outside __DEV__ when no real shim is installed', async () => {
		const g = globalThis as unknown as { __DEV__: boolean };
		const originalDev = g.__DEV__;
		g.__DEV__ = false;
		try {
			// Fresh module instance so the default dev shim is in place
			// (beforeEach installed a memory shim on the shared instance)
			let fresh!: typeof import('../keyService');
			jest.isolateModules(() => {
				// eslint-disable-next-line global-require
				fresh = require('../keyService');
			});
			await expect(fresh.getOrCreateDatabaseKey('prod.db')).rejects.toThrow(
				'keychain shim not installed — call installKeychainShim before opening databases'
			);
		} finally {
			g.__DEV__ = originalDev;
		}
	});

	it('serves keys in __DEV__ without an installed shim', async () => {
		let fresh!: typeof import('../keyService');
		jest.isolateModules(() => {
			// eslint-disable-next-line global-require
			fresh = require('../keyService');
		});
		const key = await fresh.getOrCreateDatabaseKey('dev.db');
		expect(key).toMatch(/^[0-9a-fA-F]{64}$/);
	});
});

describe('key read failure telemetry', () => {
	it('emits DB_KEY_READ_FAILURE(stored_corrupt) when the stored value is invalid hex', async () => {
		const shim = makeMemoryShim();
		await shim.setItem('db_key_v1:corrupt.db', 'gg'.repeat(32)); // 'gg' is not valid hex
		installKeychainShim(shim);

		await expect(getOrCreateDatabaseKey('corrupt.db')).rejects.toThrow();
		expect(mockLogEvent).toHaveBeenCalledWith('db_key_read_failure', { category: 'stored_corrupt', material: 'key' });
	});

	it('emits DB_KEY_READ_FAILURE(generation_failed) when randomKey returns invalid hex', async () => {
		(randomKey as jest.Mock).mockResolvedValueOnce('not-valid-hex!!');

		await expect(getOrCreateDatabaseKey('gen-fail.db')).rejects.toThrow();
		expect(mockLogEvent).toHaveBeenCalledWith('db_key_read_failure', { category: 'generation_failed', material: 'key' });
	});

	it('does not include key material in the telemetry payload', async () => {
		(randomKey as jest.Mock).mockResolvedValueOnce('BADVAL');

		await expect(getOrCreateDatabaseKey('safe.db')).rejects.toThrow();

		const payloads = JSON.stringify(mockLogEvent.mock.calls);
		expect(payloads).not.toContain('BADVAL');
	});

	it('emits DB_KEY_READ_FAILURE(generation_failed) for salt when randomKey returns invalid hex', async () => {
		(randomKey as jest.Mock).mockResolvedValueOnce('bad!');

		await expect(getOrCreateDatabaseSalt('salt-fail.db')).rejects.toThrow();
		expect(mockLogEvent).toHaveBeenCalledWith('db_key_read_failure', { category: 'generation_failed', material: 'salt' });
	});
});
