import { create, MMKVLoader, MMKVInstance, ProcessingModes } from 'react-native-mmkv-storage';
import { MMKV as RNMMKV } from 'react-native-mmkv';

import { appGroupPath } from '../database/appGroup';

export const storage = new RNMMKV({
	id: 'default',
	path: appGroupPath,
	encryptionKey: 'com.MMKV.default'
});
console.log('🚀 ~ file: userPreferences.ts ~ line 9 ~ storage', storage);

const MMKV = new MMKVLoader()
	// MODES.MULTI_PROCESS = ACCESSIBLE BY APP GROUP (iOS)
	.setProcessingMode(ProcessingModes.MULTI_PROCESS)
	.withEncryption()
	.initialize();

export const useUserPreferences = create(MMKV);

class UserPreferences {
	private mmkv: MMKVInstance;
	constructor() {
		this.mmkv = MMKV;
		console.log('🚀 ~ file: userPreferences.ts ~ line 25 ~ UserPreferences ~ constructor ~ this.mmkv', this.mmkv);
	}

	getString(key: string): string | null {
		try {
			// const res = this.mmkv.getString(key) || null;
			const rnmmkvres = storage.getString(key) || null;
			// console.log('🚀 ~ file: userPreferences.ts ~ line 31 ~ UserPreferences ~ getString ~ res', res, rnmmkvres);
			return rnmmkvres; // res;
		} catch {
			return null;
		}
	}

	setString(key: string, value: string): void {
		// const res = this.mmkv.setString(key, value) || undefined;

		storage.set(key, value);

		// return res;
	}

	getBool(key: string): boolean | null {
		try {
			// const res = this.mmkv.getBool(key) || null;

			const rnmmkvres = storage.getBoolean(key) || null;

			// console.log('🚀 ~ file: userPreferences.ts ~ line 31 ~ UserPreferences ~ getBool ~ res', res, rnmmkvres);

			return rnmmkvres; // res;
		} catch {
			return null;
		}
	}

	setBool(key: string, value: boolean): void {
		// const res = this.mmkv.setBool(key, value) || undefined;

		storage.set(key, value);

		// return res;
	}

	getMap(key: string): object | null {
		try {
			// const res = this.mmkv.getMap(key) || null;

			const rnmmkvres = storage.getString(key);

			if (!rnmmkvres) {
				return null;
			}

			// console.log('🚀 ~ file: userPreferences.ts ~ line 31 ~ UserPreferences ~ getMap ~ res', res, rnmmkvres);

			return JSON.parse(rnmmkvres); // res;
		} catch {
			return null;
		}
	}

	setMap(key: string, value: object): void {
		// const res = this.mmkv.setMap(key, value) || undefined;

		storage.set(key, JSON.stringify(value));

		// return res;
	}

	removeItem(key: string): void {
		// const res = this.mmkv.removeItem(key) || undefined;

		storage.delete(key);

		// return res;
	}
}

const userPreferences = new UserPreferences();
export default userPreferences;
