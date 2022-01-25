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

	getStringAsync(key: string): string | null | undefined {
		try {
			return this.mmkv.getString(key);
		} catch {
			return null;
		}
	}

	setStringAsync(key: string, value: string): boolean | undefined {
		return this.mmkv.setString(key, value);
	}

	getBoolAsync(key: string): boolean | null | undefined {
		try {
			return this.mmkv.getBool(key);
		} catch {
			return null;
		}
	}

	setBoolAsync(key: string, value: boolean): boolean | undefined {
		return this.mmkv.setBool(key, value);
	}

	getMapAsync(key: string): object | null | undefined {
		try {
			return this.mmkv.getMap(key);
		} catch {
			return null;
		}
	}

	setMapAsync(key: string, value: object): boolean | undefined {
		return this.mmkv.setMap(key, value);
	}

	removeItem(key: string): boolean | undefined {
		return this.mmkv.removeItem(key);
	}
}

const userPreferences = new UserPreferences();
export default userPreferences;
