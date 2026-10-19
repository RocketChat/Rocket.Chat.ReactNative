import { settings as RocketChatSettings } from '@rocket.chat/sdk';

import UserPreferences from './userPreferences';
import fetch, { headers, setSharedAuthorizationOrigin } from './helpers/fetch';
import { isSameOrigin } from './helpers/getOrigin';
import { getBasicAuthKey } from '../constants/keys';

const getBasicAuthHeader = (server: string): string | undefined => {
	const basicAuth = UserPreferences.getString(getBasicAuthKey(server));
	return basicAuth ? `Basic ${basicAuth}` : undefined;
};

const headersWith = (authorization?: string) => (authorization ? { ...headers, Authorization: authorization } : headers);

export const applyBasicAuth = (server: string): void => {
	const authorization = getBasicAuthHeader(server);
	RocketChatSettings.customHeaders = headersWith(authorization);
	setSharedAuthorizationOrigin(authorization ? server : null);
};

export const withBasicAuth = <T>(server: string, run: () => T): T => {
	const previousHeaders = RocketChatSettings.customHeaders;
	RocketChatSettings.customHeaders = headersWith(getBasicAuthHeader(server));
	try {
		return run();
	} finally {
		RocketChatSettings.customHeaders = previousHeaders;
	}
};

export const fetchForWorkspace = (server: string, url: string, options: Parameters<typeof fetch>[1] = {}) => {
	const authorization = isSameOrigin(url, server) ? getBasicAuthHeader(server) : undefined;
	return fetch(url, { ...options, headers: { ...options.headers, Authorization: authorization } });
};
