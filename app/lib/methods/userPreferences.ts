import { useState, useEffect, useCallback } from 'react';
import { MMKV } from 'react-native-mmkv';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

let storage: MMKV | null = null;
let storageInitPromise: Promise<MMKV> | null = null;

function initializeStorage(): Promise<MMKV> {
	if (storage) return Promise.resolve(storage);

	if (storageInitPromise) return storageInitPromise;

	storageInitPromise = (async (): Promise<MMKV> => {
		// Step 1: Try to get the old encryption key from AsyncStorage (saved during debug phase)
		const savedKey = await AsyncStorage.getItem('MMKV_MIGRATION_KEY');

		// Step 2: Determine the old MMKV storage path
		let mmkvPath: string | undefined;
		if (Platform.OS === 'ios') {
			// iOS: Get App Group path
			// We'll need to implement getAppGroupPath() if it doesn't exist
			// For now, use undefined to use default path
			mmkvPath = undefined; // TODO: Implement iOS app group path
		} else {
			// Android: {filesDir}/mmkv
			const filesDir = FileSystem.documentDirectory?.replace('file://', '').replace(/\/$/, '');
			mmkvPath = filesDir ? `${filesDir}/mmkv` : undefined;
		}

		// Step 3: Try to open old MMKV with the saved encryption key
		let migrated = false;
		if (savedKey && mmkvPath) {
			try {
				const oldStorage = new MMKV({
					id: 'default',
					path: mmkvPath,
					encryptionKey: savedKey
				});

				const oldKeys = oldStorage.getAllKeys();

				if (oldKeys.length > 0) {
					// Create new storage at default location WITHOUT custom path
					// This is where react-native-mmkv stores data by default
					storage = new MMKV({
						id: 'default'
						// No path, no encryption - fresh start
					});

					// Copy all data
					for (const key of oldKeys) {
						const value = oldStorage.getString(key);
						if (value !== undefined) {
							storage.set(key, value);
						}
					}

					migrated = true;

					// Clean up migration key
					await AsyncStorage.removeItem('MMKV_MIGRATION_KEY');
				}
			} catch (error) {
				// Migration failed, will use default storage
				console.error('[MMKV Migration] Error during migration:', error);
			}
		}

		// Step 4: If migration didn't happen, just open default storage
		if (!migrated) {
			storage = new MMKV({
				id: 'default'
			});
		}

		if (!storage) {
			throw new Error('Failed to initialize MMKV storage');
		}

		return storage;
	})();

	return storageInitPromise;
}

function getStorage(): Promise<MMKV> {
	if (storage) return Promise.resolve(storage);
	return initializeStorage();
}

function getStorageSync(): MMKV {
	if (!storage) {
		console.warn('[MMKV] Storage not yet initialized, waiting...');
		throw new Error('MMKV not ready. Try again shortly.');
	}
	return storage;
}

// Initialize storage when module loads
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

	async setMap(key: string, value: object): Promise<void> {
		try {
			const storageInstance = await getStorage();
			storageInstance.set(key, JSON.stringify(value));
		} catch (error) {
			console.error('Error setting map in MMKV:', error);
			throw error;
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
				try {
					return JSON.parse(storedValue) as T;
				} catch {
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
export { initializeStorage, getStorage };
