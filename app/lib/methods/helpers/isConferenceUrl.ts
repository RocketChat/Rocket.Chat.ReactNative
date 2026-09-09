import { URL } from 'react-native-url-polyfill';

// WHATWG URL keeps IPv6 hosts bracketed, so `http://[::1]:3000` reports `[::1]` as its hostname.
export const isLoopbackHostname = (hostname: string): boolean =>
	hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';

export const isSecureHttpUrl = (value: string): boolean => {
	try {
		const url = new URL(value);
		return url.protocol === 'https:' || (url.protocol === 'http:' && isLoopbackHostname(url.hostname));
	} catch {
		return false;
	}
};

export const isConferenceUrl = (url: string, server: string): boolean => {
	if (!server || !isSecureHttpUrl(server)) {
		return false;
	}

	try {
		const base = new URL(`${server.replace(/\/+$/, '')}/`);
		const target = new URL(url);

		if (!isSecureHttpUrl(url)) {
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
