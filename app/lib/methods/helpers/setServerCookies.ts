import CookieManager from '@react-native-cookies/cookies';
import { URL } from 'react-native-url-polyfill';

const COOKIE_LIFETIME_DAYS = 1;

export const setServerCookies = async (server: string, user: { id: string; token: string }): Promise<void> => {
	const date = new Date();
	date.setDate(date.getDate() + COOKIE_LIFETIME_DAYS);

	const shared = {
		domain: new URL(server).hostname,
		version: '1',
		expires: date.toISOString()
	};

	await CookieManager.set(server, { name: 'rc_uid', value: user.id, ...shared });
	await CookieManager.set(server, { name: 'rc_token', value: user.token, ...shared });
};
