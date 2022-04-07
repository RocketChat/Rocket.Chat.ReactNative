import MMKVStorage, { create } from 'react-native-mmkv-storage';

const MMKV = new MMKVStorage.Loader()
	// MODES.MULTI_PROCESS = ACCESSIBLE BY APP GROUP (iOS)
	.setProcessingMode(MMKVStorage.MODES.MULTI_PROCESS)
	.withEncryption()
	.initialize();

export const useUserPreferences = create(MMKV);

class UserPreferences {
	private mmkv: MMKVStorage.API;
	constructor() {
		this.mmkv = MMKV;
	}

	getString(key: string): string | null {
		try {
			return this.mmkv.getString(key) || null;
		} catch {
			return null;
		}
	}

	setString(key: string, value: string): boolean | undefined {
		return this.mmkv.setString(key, value);
	}

	getBool(key: string): boolean | null {
		try {
			return this.mmkv.getBool(key) || null;
		} catch {
			return null;
		}
	}

	setBool(key: string, value: boolean): boolean | undefined {
		return this.mmkv.setBool(key, value);
	}

	getMap(key: string): object | null {
		try {
			return this.mmkv.getMap(key) || null;
		} catch {
			return null;
		}
	}

	setMap(key: string, value: object): boolean | undefined {
		return this.mmkv.setMap(key, value);
	}

	removeItem(key: string): boolean | undefined {
		return this.mmkv.removeItem(key);
	}
}

const userPreferences = new UserPreferences();
export default userPreferences;
