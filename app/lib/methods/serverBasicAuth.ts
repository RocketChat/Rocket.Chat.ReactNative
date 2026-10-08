import { settings as RocketChatSettings } from '@rocket.chat/sdk';
import parse from 'url-parse';

import UserPreferences from './userPreferences';
import { headers } from './helpers/fetch';
import { getBasicAuthKey } from '../constants/keys';

export const getBasicAuthHeader = (server: string): string | undefined => {
	const basicAuth = UserPreferences.getString(getBasicAuthKey(server));
	return basicAuth ? `Basic ${basicAuth}` : undefined;
};

export const applyBasicAuth = (server: string): void => {
	const authorization = getBasicAuthHeader(server);
	RocketChatSettings.customHeaders = authorization ? { ...headers, Authorization: authorization } : headers;
};

export const getBasicAuthHeaderForUrl = (url: string, server: string): string | undefined =>
	parse(url).origin === parse(server).origin ? getBasicAuthHeader(server) : undefined;
