import { URL } from 'react-native-url-polyfill';

const blockedProtocols = ['javascript:', 'data:', 'vbscript:'];

const base = 'https://rocket.chat/';

export const isSafeUrl = (url: string): boolean => {
	try {
		return !blockedProtocols.includes(new URL(url, base).protocol);
	} catch {
		return false;
	}
};
