import { useState, useCallback } from 'react';
import { MMKV, Mode } from 'react-native-mmkv';
import type { Configuration } from 'react-native-mmkv';
import { NativeModules } from 'react-native';

import { isAndroid } from './helpers';

let storage: MMKV | null = null;

const initializeStorage = (): MMKV => {
	if (!storage) {
		storage = new MMKV(buildConfiguration());
	}
	return storage;
};

class UserPreferences {
	private mmkv: MMKV;

	constructor() {
		this.mmkv = initializeStorage();
	}

	getString(key: string): string | null {
		try {
			return this.mmkv.getString(key) || null;
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
			return this.mmkv.getBoolean(key) || null;
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
			return this.mmkv.getNumber(key) || null;
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
}

export const useUserPreferences = <T>(key: string, defaultValue?: T): [T | undefined, (value: T) => void] => {
	const getInitialValue = useCallback((): T | undefined => {
		try {
			const mmkv = initializeStorage();
			const storedValue = mmkv.getString(key);
			if (storedValue !== undefined) {
				try {
					return JSON.parse(storedValue) as T;
				} catch {
					return storedValue as T;
				}
			}

			const boolValue = mmkv.getBoolean(key);
			if (boolValue !== undefined) {
				return boolValue as T;
			}

			const numValue = mmkv.getNumber(key);
			if (numValue !== undefined) {
				return numValue as T;
			}
			return defaultValue;
		} catch {
			return defaultValue;
		}
	}, [key, defaultValue]);

	const [value, setValue] = useState<T | undefined>(getInitialValue);

	const setStoredValue = useCallback(
		(newValue: T) => {
			try {
				const mmkv = initializeStorage();
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
};

const buildConfiguration = (): Configuration => {
	const config: Configuration = {
		id: 'default'
	};

	const multiProcessMode = (Mode as { MULTI_PROCESS?: Mode })?.MULTI_PROCESS;
	if (multiProcessMode) {
		config.mode = multiProcessMode;
	}

	const appGroupPath = getAppGroupPath();
	if (!isAndroid && appGroupPath) {
		config.path = `${appGroupPath}mmkv`;
	}

	return config;
};

const getAppGroupPath = (): string => {
	if (isAndroid) {
		return '';
	}

	try {
		const { AppGroup } = NativeModules;
		return AppGroup?.path || '';
	} catch {
		return '';
	}
};

const userPreferences = new UserPreferences();
export default userPreferences;
export { initializeStorage };
