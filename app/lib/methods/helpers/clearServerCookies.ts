import CookieManager from '@react-native-cookies/cookies';
import { URL } from 'react-native-url-polyfill';

import { isAndroid } from './deviceInfo';

const SERVER_COOKIE_NAMES = ['rc_uid', 'rc_token'];

const workspaceCookiePath = (server: string): string | null => {
	try {
		const scoped = new URL(server).pathname.replace(/\/+$/, '');
		return scoped && scoped !== '/' ? scoped : null;
	} catch {
		return null;
	}
};

const hasCookieDelimiters = (value: string): boolean => /[;\r\n]/.test(value);

export const clearServerCookies = async (server: string): Promise<void> => {
	if (!server) {
		return;
	}

	const scoped = workspaceCookiePath(server);
	const safeScoped = scoped && !hasCookieDelimiters(scoped) ? scoped : null;
	const paths = safeScoped ? [safeScoped, '/'] : ['/'];

	for (const name of SERVER_COOKIE_NAMES) {
		for (const path of paths) {
			await CookieManager.setFromResponse(server, `${name}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=${path}`);
		}
	}

	if (isAndroid) {
		await CookieManager.flush();
	}
};
