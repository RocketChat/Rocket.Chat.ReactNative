import { MMKV, Mode, useMMKVString, useMMKVNumber } from 'react-native-mmkv';
import type { Configuration } from 'react-native-mmkv';
import { NativeModules } from 'react-native';

import { isAndroid } from './helpers';

/**
 * Get the MMKV encryption key from native secure storage.
 * This key is managed by:
 * - Android: MMKVKeyManager.java (reads from SecureKeystore or generates new)
 * - iOS: SecureStorage.m (reads from Keychain or generates new)
 */
const getEncryptionKey = (): string | undefined => {
	try {
		const { SecureStorage } = NativeModules;
		const key = SecureStorage?.getMMKVEncryptionKey?.();
		return key && key !== null ? key : undefined;
	} catch (error) {
		console.warn('[UserPreferences] Failed to get MMKV encryption key:', error);
		return undefined;
	}
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

	// Get encryption key from native secure storage
	const encryptionKey = getEncryptionKey();
	if (encryptionKey) {
		config.encryptionKey = encryptionKey;
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

const MMKV_INSTANCE = new MMKV(buildConfiguration());

export const useUserPreferences = <T>(key: string, defaultValue?: T): [T | undefined, (value: T | undefined) => void] => {
	// Use native number storage for numbers to ensure consistency
	const isNumberType = typeof defaultValue === 'number';
	const [storedNumber, setStoredNumber] = useMMKVNumber(key, MMKV_INSTANCE);
	const [storedString, setStoredString] = useMMKVString(key, MMKV_INSTANCE);

	let value: T | undefined = defaultValue;
	
	if (isNumberType) {
		// For numbers, use native number storage
		if (storedNumber !== undefined && storedNumber !== null) {
			value = storedNumber as T;
		}
		// Fallback: check if stored as JSON string (for migration)
		else if (storedString !== undefined) {
			try {
				const parsed = JSON.parse(storedString);
				if (typeof parsed === 'number') {
					// Migrate to native number storage
					setStoredNumber(parsed);
					value = parsed as T;
				}
			} catch {
				// Ignore parse errors
			}
		}
	} else {
		// For non-numbers, use string storage
		if (storedString !== undefined) {
			if (typeof defaultValue === 'string' || defaultValue === undefined) {
				value = storedString as T;
			} else {
				try {
					value = JSON.parse(storedString) as T;
				} catch {
					value = defaultValue;
				}
			}
		}
	}

	const setValue = (newValue: T | undefined) => {
		if (newValue === undefined) {
			if (isNumberType) {
				setStoredNumber(undefined);
			}
			setStoredString(undefined);
		} else if (isNumberType && typeof newValue === 'number') {
			setStoredNumber(newValue);
			// Also clear string storage if it exists (migration cleanup)
			if (storedString !== undefined) {
				setStoredString(undefined);
			}
		} else if (typeof newValue === 'string') {
			setStoredString(newValue);
		} else {
			setStoredString(JSON.stringify(newValue));
		}
	};

	return [value, setValue];
};

class UserPreferences {
	private mmkv: MMKV;

	constructor() {
		this.mmkv = MMKV_INSTANCE;
	}

	getString(key: string): string | null {
		try {
			return this.mmkv.getString(key) || null;
		} catch {
			return null;
		}
	}

	setString(key: string, value: string): void {
		this.mmkv.set(key, value);
	}

	getBool(key: string): boolean | null {
		try {
			return this.mmkv.getBoolean(key) || null;
		} catch {
			return null;
		}
	}

	setBool(key: string, value: boolean): void {
		this.mmkv.set(key, value);
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
		this.mmkv.set(key, JSON.stringify(value));
	}

	removeItem(key: string): void {
		this.mmkv.delete(key);
	}

	getNumber(key: string): number | null {
		try {
			return this.mmkv.getNumber(key) || null;
		} catch {
			return null;
		}
	}

	setNumber(key: string, value: number): void {
		this.mmkv.set(key, value);
	}

	getAllKeys(): string[] {
		return this.mmkv.getAllKeys();
	}

	contains(key: string): boolean {
		return this.mmkv.contains(key);
	}

	clearAll(): void {
		this.mmkv.clearAll();
	}
}

const userPreferences = new UserPreferences();
export default userPreferences;
export { MMKV_INSTANCE as initializeStorage };
