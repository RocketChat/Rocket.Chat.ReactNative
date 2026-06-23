/**
 * keyStore.ts tests — verifies the native module shim wiring.
 *
 * Covers:
 *  - installNativeKeychainShim delegates getItem/setItem/removeItem to the native module
 *  - Missing native module throws a clear error (not an obscure undefined crash)
 */

import { installKeychainShim } from '../keyService';
import { installNativeKeychainShim } from '../keyStore';
import NativeDatabaseKeyStore from '../../../native/NativeDatabaseKeyStore';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('../../../native/NativeDatabaseKeyStore', () => ({
	__esModule: true,
	default: {
		getItem: jest.fn(async (_key: string): Promise<string | null> => null),
		setItem: jest.fn(async (_key: string, _value: string): Promise<void> => undefined),
		removeItem: jest.fn(async (_key: string): Promise<void> => undefined)
	}
}));

jest.mock('../keyService', () => ({
	installKeychainShim: jest.fn()
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('installNativeKeychainShim', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('calls installKeychainShim with an object that delegates to the native module', async () => {
		installNativeKeychainShim();

		expect(installKeychainShim).toHaveBeenCalledTimes(1);
		const shim = (installKeychainShim as jest.Mock).mock.calls[0][0];

		// getItem delegates
		const mockNative = NativeDatabaseKeyStore!;
		(mockNative.getItem as jest.Mock).mockResolvedValueOnce('abc123');
		const result = await shim.getItem('db_key_v1:test.db');
		expect(mockNative.getItem).toHaveBeenCalledWith('db_key_v1:test.db');
		expect(result).toBe('abc123');

		// setItem delegates
		await shim.setItem('db_key_v1:test.db', 'hexvalue');
		expect(mockNative.setItem).toHaveBeenCalledWith('db_key_v1:test.db', 'hexvalue');

		// removeItem delegates
		await shim.removeItem('db_key_v1:test.db');
		expect(mockNative.removeItem).toHaveBeenCalledWith('db_key_v1:test.db');
	});

	it('throws a descriptive error when the native module is not linked', () => {
		jest.resetModules();
		jest.doMock('../../../native/NativeDatabaseKeyStore', () => ({
			__esModule: true,
			default: null
		}));
		jest.doMock('../keyService', () => ({ installKeychainShim: jest.fn() }));

		// Load a fresh copy of the module without the native module present
		const { installNativeKeychainShim: freshInstall } = require('../keyStore');
		expect(() => freshInstall()).toThrow('DatabaseKeyStore native module not found');
	});
});
