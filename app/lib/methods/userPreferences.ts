import { useState, useEffect, useCallback } from 'react';
import { MMKV } from 'react-native-mmkv';

import { getSecureKey } from './helpers/getSecureKey';

let storage: MMKV | null = null;
let storageInitPromise: Promise<MMKV> | null = null;

function initializeStorage() {
	if (storage) return storage;

	if (storageInitPromise) return storageInitPromise;

	storageInitPromise = (async () => {
		const encryptionKey = await getSecureKey('com.MMKV.default');
		console.log('[MMKV Init] Encryption key retrieved:', encryptionKey ? 'YES' : 'NO');

		storage = new MMKV({
			id: 'default',
			encryptionKey: encryptionKey || undefined
		});

		return storage;
	})();

	return storageInitPromise;
}

function getStorage(): MMKV {
	if (!storage) {
		throw new Error('MMKV not initialized. Ensure migrateMMKVStorage() runs first.');
	}
	return storage;
}

// Start initialization and migration when module loads
(async () => {
	try {
		const storage = await initializeStorage();

		// Run migration check
		const MIGRATION_KEY = 'MMKV_MIGRATION_COMPLETED_V1';
		const migrationCompleted = storage.getBoolean(MIGRATION_KEY);

		if (!migrationCompleted) {
			const allKeys = storage.getAllKeys();
			console.log(`[MMKV Migration] Found ${allKeys.length} keys in storage`);

			if (allKeys.length > 0) {
				console.log('[MMKV Migration] Sample keys:', allKeys.slice(0, 10));
				const hasToken = allKeys.some(k => k.includes('usertoken'));
				const hasServers = allKeys.some(k => k.includes('servers'));
				console.log('[MMKV Migration] Has user tokens:', hasToken);
				console.log('[MMKV Migration] Has servers:', hasServers);
			}

			storage.set(MIGRATION_KEY, true);
			console.log('[MMKV Migration] Completed');
		}
	} catch (error) {
		console.error('[MMKV Init/Migration] Failed:', error);
	}
})();

class UserPreferences {
	getString(key: string): string | null {
		try {
			return getStorage().getString(key) ?? null;
		} catch {
			return null;
		}
	}

	setString(key: string, value: string): void {
		try {
			getStorage().set(key, value);
		} catch (error) {
			console.error('Error setting string in MMKV:', error);
		}
	}

	getBool(key: string): boolean | null {
		try {
			return getStorage().getBoolean(key) ?? null;
		} catch {
			return null;
		}
	}

	setBool(key: string, value: boolean): void {
		try {
			getStorage().set(key, value);
		} catch (error) {
			console.error('Error setting boolean in MMKV:', error);
		}
	}

	getMap(key: string): object | null {
		try {
			const jsonString = getStorage().getString(key);
			return jsonString ? JSON.parse(jsonString) : null;
		} catch {
			return null;
		}
	}

	setMap(key: string, value: object): void {
		try {
			getStorage().set(key, JSON.stringify(value));
		} catch (error) {
			console.error('Error setting map in MMKV:', error);
		}
	}

	removeItem(key: string): void {
		try {
			getStorage().delete(key);
		} catch (error) {
			console.error('Error removing item from MMKV:', error);
		}
	}

	// Additional utility methods
	getNumber(key: string): number | null {
		try {
			return getStorage().getNumber(key) ?? null;
		} catch {
			return null;
		}
	}

	setNumber(key: string, value: number): void {
		try {
			getStorage().set(key, value);
		} catch (error) {
			console.error('Error setting number in MMKV:', error);
		}
	}

	getAllKeys(): string[] {
		try {
			return getStorage().getAllKeys();
		} catch {
			return [];
		}
	}

	contains(key: string): boolean {
		try {
			return getStorage().contains(key);
		} catch {
			return false;
		}
	}

	clearAll(): void {
		try {
			getStorage().clearAll();
		} catch (error) {
			console.error('Error clearing MMKV:', error);
		}
	}
}

// Hook to use user preferences with react-native-mmkv
export function useUserPreferences<T>(key: string, defaultValue?: T): [T | undefined, (value: T) => void] {
	const getInitialValue = useCallback((): T | undefined => {
		try {
			const storedValue = getStorage().getString(key);
			if (storedValue !== undefined) {
				// Try to parse as JSON first (for objects)
				try {
					return JSON.parse(storedValue) as T;
				} catch {
					// If it's not JSON, return as is (for strings)
					return storedValue as T;
				}
			}
			// Check for boolean
			const boolValue = getStorage().getBoolean(key);
			if (boolValue !== undefined) {
				return boolValue as T;
			}
			// Check for number
			const numValue = getStorage().getNumber(key);
			if (numValue !== undefined) {
				return numValue as T;
			}
			return defaultValue;
		} catch {
			return defaultValue;
		}
	}, [key, defaultValue]);

	const [value, setValue] = useState<T | undefined>(getInitialValue);

	// Listen for changes
	useEffect(() => {
		const listener = getStorage().addOnValueChangedListener(changedKey => {
			if (changedKey === key) {
				setValue(getInitialValue());
			}
		});

		return () => {
			listener.remove();
		};
	}, [key, getInitialValue]);

	const setStoredValue = useCallback(
		(newValue: T) => {
			try {
				const mmkv = getStorage();
				if (typeof newValue === 'string') {
					mmkv.set(key, newValue);
				} else if (typeof newValue === 'boolean') {
					mmkv.set(key, newValue);
				} else if (typeof newValue === 'number') {
					mmkv.set(key, newValue);
				} else if (typeof newValue === 'object') {
					mmkv.set(key, JSON.stringify(newValue));
				}
				setValue(newValue);
			} catch (error) {
				console.error(`Error setting value for key ${key}:`, error);
			}
		},
		[key]
	);

	return [value, setStoredValue];
}

const userPreferences = new UserPreferences();
export default userPreferences;
export { initializeStorage };
