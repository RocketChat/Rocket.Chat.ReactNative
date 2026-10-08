import { URL } from 'react-native-url-polyfill';

export const getOrigin = (url: string): string | null => {
	if (!url) {
		return null;
	}
	try {
		const { protocol, origin } = new URL(url);
		return protocol === 'http:' || protocol === 'https:' ? origin.toLowerCase() : null;
	} catch {
		return null;
	}
};

export const isSameOrigin = (url: string, other: string | null): boolean => {
	const origin = getOrigin(url);
	return !!origin && origin === (other ? getOrigin(other) : null);
};
