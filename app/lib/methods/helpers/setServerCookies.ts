import CookieManager from '@react-native-cookies/cookies';
import { URL } from 'react-native-url-polyfill';

import { isAndroid } from './deviceInfo';
import { isHttpsUrl } from './isConferenceUrl';

const COOKIE_LIFETIME_DAYS = 1;
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

export const setServerCookies = async (server: string, user: { id: string; token: string }): Promise<void> => {
	if (!isHttpsUrl(server)) {
		throw new Error('Refusing to set server cookies for an insecure server url');
	}

	if (hasCookieDelimiters(user.id) || hasCookieDelimiters(user.token)) {
		throw new Error('Refusing to set server cookies with unsafe credential values');
	}

	const date = new Date();
	date.setDate(date.getDate() + COOKIE_LIFETIME_DAYS);

	const cookiePath = workspaceCookiePath(server) ?? '/';
	if (hasCookieDelimiters(cookiePath)) {
		throw new Error('Refusing to set server cookies with an unsafe workspace path');
	}

	const suffix = [`Expires=${date.toUTCString()}`, `Path=${cookiePath}`, 'Secure'].join('; ');

	await CookieManager.setFromResponse(server, `rc_uid=${user.id}; ${suffix}`);
	await CookieManager.setFromResponse(server, `rc_token=${user.token}; ${suffix}`);
};

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
