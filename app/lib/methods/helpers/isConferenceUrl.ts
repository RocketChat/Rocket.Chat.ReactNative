import { URL } from 'react-native-url-polyfill';

export const isConferenceUrl = (url: string, server: string): boolean => {
	if (!server) {
		return false;
	}

	try {
		const base = new URL(`${server.replace(/\/+$/, '')}/`);
		const target = new URL(url);

		if (target.protocol !== 'https:' && target.protocol !== 'http:') {
			return false;
		}

		if (target.origin !== base.origin) {
			return false;
		}

		return target.pathname.startsWith(`${base.pathname}conference/`);
	} catch {
		return false;
	}
};
