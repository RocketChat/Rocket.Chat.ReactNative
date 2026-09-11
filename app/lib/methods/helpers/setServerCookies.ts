import CookieManager from '@react-native-cookies/cookies';
import { URL } from 'react-native-url-polyfill';

import { isAndroid } from './deviceInfo';
import { isSecureHttpUrl } from './isConferenceUrl';

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

type TSetServerCookiesOptions = {
	/**
	 * Write the credential cookies even when the server is plain http. Only for callers that
	 * predate the check and would otherwise lose authentication on cleartext deployments — the
	 * login token is sent unencrypted on every request to such a server.
	 */
	allowInsecureServer?: boolean;
};

export const setServerCookies = async (
	server: string,
	user: { id: string; token: string },
	{ allowInsecureServer = false }: TSetServerCookiesOptions = {}
): Promise<void> => {
	if (!allowInsecureServer && !isSecureHttpUrl(server)) {
		throw new Error('Refusing to set server cookies for an insecure server url');
	}

	const date = new Date();
	date.setDate(date.getDate() + COOKIE_LIFETIME_DAYS);

	const { protocol } = new URL(server);
	const cookiePath = workspaceCookiePath(server) ?? '/';

	const attributes = [`Expires=${date.toUTCString()}`, `Path=${cookiePath}`];
	if (protocol === 'https:') {
		attributes.push('Secure');
	}
	const suffix = attributes.join('; ');

	await CookieManager.setFromResponse(server, `rc_uid=${user.id}; ${suffix}`);
	await CookieManager.setFromResponse(server, `rc_token=${user.token}; ${suffix}`);
};

export const clearServerCookies = async (server: string): Promise<void> => {
	if (!server) {
		return;
	}

	const scoped = workspaceCookiePath(server);
	const paths = scoped ? [scoped, '/'] : ['/'];

	for (const name of SERVER_COOKIE_NAMES) {
		for (const path of paths) {
			await CookieManager.setFromResponse(server, `${name}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=${path}`);
		}
	}

	if (isAndroid) {
		await CookieManager.flush();
	}
};
