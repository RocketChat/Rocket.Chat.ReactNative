import MMKVStorage from 'react-native-mmkv-storage';

const MMKV = new MMKVStorage.Loader()
	// MODES.MULTI_PROCESS = ACCESSIBLE BY APP GROUP (iOS)
	.setProcessingMode(MMKVStorage.MODES.MULTI_PROCESS)
	.withEncryption()
	.initialize();

class UserPreferences {
	private mmkv: MMKVStorage.API;
	constructor() {
		this.mmkv = MMKV;
	}

	getString(key: string): string | null | undefined {
		try {
			return this.mmkv.getString(key);
		} catch {
			return null;
		}
	}

	setString(key: string, value: string): boolean | undefined {
		return this.mmkv.setString(key, value);
	}

	getBool(key: string): boolean | null | undefined {
		try {
			return this.mmkv.getBool(key);
		} catch {
			return null;
		}
	}

	setBool(key: string, value: boolean): boolean | undefined {
		return this.mmkv.setBool(key, value);
	}

	getMap(key: string): object | null | undefined {
		try {
			return this.mmkv.getMap(key);
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
