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

	const serverUrl = new URL(server);
	const shared = {
		domain: serverUrl.hostname,
		version: '1',
		expires: date.toISOString(),
		...(serverUrl.protocol === 'https:' ? { secure: true } : {})
	};

	await CookieManager.set(server, { name: 'rc_uid', value: user.id, ...shared });
	await CookieManager.set(server, { name: 'rc_token', value: user.token, ...shared });
};
