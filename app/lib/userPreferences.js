import MMKVStorage from 'react-native-mmkv-storage';

const MMKV = new MMKVStorage.Loader()
	// MODES.MULTI_PROCESS = ACCESSIBLE BY APP GROUP (iOS)
	.setProcessingMode(MMKVStorage.MODES.MULTI_PROCESS)
	.withEncryption()
	.initialize();

class UserPreferences {
	constructor() {
		this.mmkv = MMKV;
	}

	async getStringAsync(key) {
		try {
			const value = await this.mmkv.getStringAsync(key);
			return value;
		} catch {
			return null;
		}
	}

	setStringAsync(key, value) {
		return this.mmkv.setStringAsync(key, value);
	}

	async getBoolAsync(key) {
		try {
			const value = await this.mmkv.getBoolAsync(key);
			return value;
		} catch {
			return null;
		}
	}

	setBoolAsync(key, value) {
		return this.mmkv.setBoolAsync(key, value);
	}

	async getMapAsync(key) {
		try {
			const value = await this.mmkv.getMapAsync(key);
			return value;
		} catch {
			return null;
		}
	}

	setMapAsync(key, value) {
		return this.mmkv.setMapAsync(key, value);
	}

	removeItem(key) {
		return this.mmkv.removeItem(key);
	}
}

const userPreferences = new UserPreferences();
export default userPreferences;
