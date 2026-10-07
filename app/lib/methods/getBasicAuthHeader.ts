import parse from 'url-parse';

import UserPreferences from './userPreferences';
import { setBasicAuth } from './helpers/fetch';
import { getBasicAuthKey } from '../constants/keys';

const getStoredBasicAuth = (server: string) => UserPreferences.getString(getBasicAuthKey(server));

export const getBasicAuthHeader = (server: string): string | undefined => {
	const basicAuth = getStoredBasicAuth(server);
	return basicAuth ? `Basic ${basicAuth}` : undefined;
};

export const applyBasicAuth = (server: string): void => setBasicAuth(getStoredBasicAuth(server));

export const getBasicAuthHeaderForUrl = (url: string, server: string): string | undefined =>
	parse(url).origin === parse(server).origin ? getBasicAuthHeader(server) : undefined;
