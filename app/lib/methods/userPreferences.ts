import { MMKV, Mode, useMMKVString } from 'react-native-mmkv';
import type { Configuration } from 'react-native-mmkv';
import { NativeModules } from 'react-native';

import { isAndroid } from './helpers';

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

const MMKV_INSTANCE = new MMKV(buildConfiguration());

export const useUserPreferences = <T>(key: string, defaultValue?: T): [T | undefined, (value: T | undefined) => void] => {
	const [storedValue, setStoredValue] = useMMKVString(key, MMKV_INSTANCE);

	let value: T | undefined = defaultValue;
	if (storedValue !== undefined) {
		if (typeof defaultValue === 'string' || defaultValue === undefined) {
			value = storedValue as T;
		} else {
			try {
				value = JSON.parse(storedValue) as T;
			} catch {
				value = defaultValue;
			}
		}
	}

	const setValue = (newValue: T | undefined) => {
		if (newValue === undefined) {
			setStoredValue(undefined);
		} else if (typeof newValue === 'string') {
			setStoredValue(newValue);
		} else {
			setStoredValue(JSON.stringify(newValue));
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
