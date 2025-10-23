import { useState, useEffect, useCallback } from 'react';
import { MMKV } from 'react-native-mmkv';

// Initialize NEW MMKV with encryption and multi-process mode
const storage = new MMKV({
	id: 'default',
	encryptionKey: 'hunter2' // This will be replaced by native initialization with proper key
});

// Note: The encryption key and multi-process setup is handled by native code
// in ios/AppDelegate.swift and android/app/.../MainApplication.kt

// Run migration from old MMKV files using file system
// This reads the files directly without initializing the old library

class UserPreferences {
	private mmkv: MMKV;

	constructor() {
		this.mmkv = storage;
	}

	getString(key: string): string | null {
		try {
			return this.mmkv.getString(key) ?? null;
		} catch {
			return null;
		}
	}

	setString(key: string, value: string): void {
		try {
			this.mmkv.set(key, value);
		} catch (error) {
			console.error('Error setting string in MMKV:', error);
		}
	}

	getBool(key: string): boolean | null {
		try {
			return this.mmkv.getBoolean(key) ?? null;
		} catch {
			return null;
		}
	}

	setBool(key: string, value: boolean): void {
		try {
			this.mmkv.set(key, value);
		} catch (error) {
			console.error('Error setting boolean in MMKV:', error);
		}
	}

	getMap(key: string): object | null {
		try {
			const jsonString = this.mmkv.getString(key);
			return jsonString ? JSON.parse(jsonString) : null;
		} catch {
			return null;
		}
	}

	setMap(key: string, value: object): void {
		try {
			this.mmkv.set(key, JSON.stringify(value));
		} catch (error) {
			console.error('Error setting map in MMKV:', error);
		}
	}

	removeItem(key: string): void {
		try {
			this.mmkv.delete(key);
		} catch (error) {
			console.error('Error removing item from MMKV:', error);
		}
	}

	// Additional utility methods
	getNumber(key: string): number | null {
		try {
			return this.mmkv.getNumber(key) ?? null;
		} catch {
			return null;
		}
	}

	setNumber(key: string, value: number): void {
		try {
			this.mmkv.set(key, value);
		} catch (error) {
			console.error('Error setting number in MMKV:', error);
		}
	}

	getAllKeys(): string[] {
		try {
			return this.mmkv.getAllKeys();
		} catch {
			return [];
		}
	}

	contains(key: string): boolean {
		try {
			return this.mmkv.contains(key);
		} catch {
			return false;
		}
	}

	clearAll(): void {
		try {
			this.mmkv.clearAll();
		} catch (error) {
			console.error('Error clearing MMKV:', error);
		}
	}

	// Migration status check
	isMigrationCompleted(): boolean {
		return this.mmkv.getBoolean('__mmkv_migration_completed') ?? false;
	}

	getMigrationInfo(): {
		completed: boolean;
		timestamp?: number;
		sourcePath?: string;
	} {
		return {
			completed: this.mmkv.getBoolean('__mmkv_migration_completed') ?? false,
			timestamp: this.mmkv.getNumber('__mmkv_migration_timestamp'),
			sourcePath: this.mmkv.getString('__mmkv_migration_source_path') ?? undefined
		};
	}
}

// Hook to use user preferences with react-native-mmkv
export function useUserPreferences<T>(key: string, defaultValue?: T): [T | undefined, (value: T) => void] {
	const getInitialValue = useCallback((): T | undefined => {
		try {
			const storedValue = storage.getString(key);
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
			const boolValue = storage.getBoolean(key);
			if (boolValue !== undefined) {
				return boolValue as T;
			}
			// Check for number
			const numValue = storage.getNumber(key);
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
		const listener = storage.addOnValueChangedListener(changedKey => {
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
				if (typeof newValue === 'string') {
					storage.set(key, newValue);
				} else if (typeof newValue === 'boolean') {
					storage.set(key, newValue);
				} else if (typeof newValue === 'number') {
					storage.set(key, newValue);
				} else if (typeof newValue === 'object') {
					storage.set(key, JSON.stringify(newValue));
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
