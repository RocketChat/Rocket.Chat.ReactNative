import { NativeModules, Platform } from 'react-native';

interface ISecureStorage {
	getSecureKey: (alias: string) => Promise<string | null>;
	setSecureKey: (alias: string, value: string) => Promise<void>;
	getAppGroupPath?: () => Promise<string | null>;
}

const { SecureStorage } = NativeModules as { SecureStorage: ISecureStorage };

function stringToHex(str: string): string {
	let hex = '';
	for (let i = 0; i < str.length; i++) {
		const charCode = str.charCodeAt(i);
		hex += charCode.toString(16).padStart(2, '0');
	}
	return hex;
}

export async function getSecureKey(alias: string): Promise<string | null> {
	try {
		const hexAlias = stringToHex(alias);
		const key = await SecureStorage.getSecureKey(hexAlias);
		return key;
	} catch (error) {
		console.error('[getSecureKey] Error retrieving key:', error);
		return null;
	}
}

export async function setSecureKey(alias: string, value: string): Promise<void> {
	try {
		const hexAlias = stringToHex(alias);
		await SecureStorage.setSecureKey(hexAlias, value);
	} catch (error) {
		console.error('[setSecureKey] Error storing key:', error);
		throw error;
	}
}

export async function getAppGroupPath(): Promise<string | null> {
	try {
		// Android doesn't have app groups, only iOS
		if (Platform.OS === 'android') {
			return null;
		}
		return await SecureStorage.getAppGroupPath?.();
	} catch (error) {
		console.error('[getAppGroupPath] Error:', error);
		return null;
	}
}
