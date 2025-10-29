import { useState, useEffect, useCallback } from 'react';
import { MMKV } from 'react-native-mmkv';

import { getSecureKey, getAppGroupPath } from './helpers/getSecureKey';

let storage: MMKV | null = null;
let storageInitPromise: Promise<MMKV> | null = null;

function initializeStorage() {
	if (storage) return storage;

	if (storageInitPromise) return storageInitPromise;

	storageInitPromise = (async () => {
		const [encryptionKey, appGroupPath] = await Promise.all([getSecureKey('com.MMKV.default'), getAppGroupPath()]);

		// Old react-native-mmkv-storage used:
		// - iOS: '{AppGroup}/mmkv' subdirectory
		// - Android: default MMKV path (no custom path needed)
		const mmkvPath = appGroupPath ? `${appGroupPath}/mmkv` : undefined;

		storage = new MMKV({
			id: 'default',
			path: mmkvPath,
			encryptionKey: encryptionKey || undefined
		});

		return storage;
	})();

	return storageInitPromise;
}

function getStorageSync(): MMKV {
	if (!storage) {
		console.warn('[MMKV] Storage not yet initialized, waiting...');
		throw new Error('MMKV not ready. Try again shortly.');
	}
	return storage;
}

// Initialize storage when module loads
// This happens automatically when userPreferences is first imported
initializeStorage();

class UserPreferences {
	getString(key: string): string | null {
		try {
			return getStorageSync().getString(key) ?? null;
		} catch {
			return null;
		}
	}

	setString(key: string, value: string): void {
		try {
			getStorageSync().set(key, value);
		} catch (error) {
			console.error('Error setting string in MMKV:', error);
		}
	}

	getBool(key: string): boolean | null {
		try {
			return getStorageSync().getBoolean(key) ?? null;
		} catch {
			return null;
		}
	}

	setBool(key: string, value: boolean): void {
		try {
			getStorageSync().set(key, value);
		} catch (error) {
			console.error('Error setting boolean in MMKV:', error);
		}
	}

	getMap(key: string): object | null {
		try {
			const jsonString = getStorageSync().getString(key);
			return jsonString ? JSON.parse(jsonString) : null;
		} catch {
			return null;
		}
	}

	setMap(key: string, value: object): void {
		try {
			console.log('setMap', key, value);
			getStorageSync().set(key, JSON.stringify(value));
		} catch (error) {
			console.error('Error setting map in MMKV:', error);
		}
	}

	removeItem(key: string): void {
		try {
			getStorageSync().delete(key);
		} catch (error) {
			console.error('Error removing item from MMKV:', error);
		}
	}

	// Additional utility methods
	getNumber(key: string): number | null {
		try {
			return getStorageSync().getNumber(key) ?? null;
		} catch {
			return null;
		}
	}

	setNumber(key: string, value: number): void {
		try {
			getStorageSync().set(key, value);
		} catch (error) {
			console.error('Error setting number in MMKV:', error);
		}
	}

	getAllKeys(): string[] {
		try {
			return getStorageSync().getAllKeys();
		} catch {
			return [];
		}
	}

	contains(key: string): boolean {
		try {
			return getStorageSync().contains(key);
		} catch {
			return false;
		}
	}

	clearAll(): void {
		try {
			getStorageSync().clearAll();
		} catch (error) {
			console.error('Error clearing MMKV:', error);
		}
	}
}

// Hook to use user preferences with react-native-mmkv
export function useUserPreferences<T>(key: string, defaultValue?: T): [T | undefined, (value: T) => void] {
	const getInitialValue = useCallback((): T | undefined => {
		try {
			const storedValue = getStorageSync().getString(key);
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
			const boolValue = getStorageSync().getBoolean(key);
			if (boolValue !== undefined) {
				return boolValue as T;
			}
			// Check for number
			const numValue = getStorageSync().getNumber(key);
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
		const listener = getStorageSync().addOnValueChangedListener(changedKey => {
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
				const mmkv = getStorageSync();
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
