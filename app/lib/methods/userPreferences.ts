import { create, MMKVLoader, MMKVInstance, ProcessingModes, IOSAccessibleStates } from 'react-native-mmkv-storage';

const MMKV = new MMKVLoader()
	// MODES.MULTI_PROCESS = ACCESSIBLE BY APP GROUP (iOS)
	.setProcessingMode(ProcessingModes.MULTI_PROCESS)
	.setAccessibleIOS(IOSAccessibleStates.AFTER_FIRST_UNLOCK)
	.withEncryption()
	.initialize();

export const useUserPreferences = create(MMKV);

class UserPreferences {
	private mmkv: MMKVInstance;
	constructor() {
		this.mmkv = MMKV;
	}

	getString(key: string): string | null {
		try {
			return this.mmkv.getString(key) ?? null;
		} catch {
			return null;
		}
	}

	setString(key: string, value: string): boolean | undefined {
		return this.mmkv.setString(key, value) ?? undefined;
	}

	getBool(key: string): boolean | null {
		try {
			return this.mmkv.getBool(key) ?? null;
		} catch {
			return null;
		}
	}

	setBool(key: string, value: boolean): boolean | undefined {
		return this.mmkv.setBool(key, value) ?? undefined;
	}

	getMap(key: string): object | null {
		try {
			return this.mmkv.getMap(key) ?? null;
		} catch {
			return null;
		}
	}

	setMap(key: string, value: object): boolean | undefined {
		return this.mmkv.setMap(key, value) ?? undefined;
	}

	removeItem(key: string): boolean | undefined {
		return this.mmkv.removeItem(key) ?? undefined;
	}
}

const userPreferences = new UserPreferences();
export default userPreferences;
