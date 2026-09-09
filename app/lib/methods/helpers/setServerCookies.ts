import CookieManager from '@react-native-cookies/cookies';
import { URL } from 'react-native-url-polyfill';

import { isSecureHttpUrl } from './isConferenceUrl';

const COOKIE_LIFETIME_DAYS = 1;

export const setServerCookies = async (server: string, user: { id: string; token: string }): Promise<void> => {
	if (!isSecureHttpUrl(server)) {
		throw new Error('Refusing to set server cookies for an insecure server url');
	}

	const date = new Date();
	date.setDate(date.getDate() + COOKIE_LIFETIME_DAYS);

	// Set-Cookie strings omit Domain so the cookies stay host-only instead of leaking to subdomains.
	const attributes = [`Expires=${date.toUTCString()}`, 'Path=/'];
	if (new URL(server).protocol === 'https:') {
		attributes.push('Secure');
	}
	const suffix = attributes.join('; ');

	await CookieManager.setFromResponse(server, `rc_uid=${user.id}; ${suffix}`);
	await CookieManager.setFromResponse(server, `rc_token=${user.token}; ${suffix}`);
};
