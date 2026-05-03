import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

import sdk from '../../services/sdk';

export type TMethods = 'POST' | 'GET' | 'DELETE' | 'PUT' | 'post' | 'get' | 'delete' | 'put';

interface CustomHeaders {
	'User-Agent'?: string;
	Authorization?: string;
	'Content-Type'?: string;
	'X-Auth-Token'?: string;
	'X-User-Id'?: string;
}

interface IOptions {
	headers?: CustomHeaders;
	signal?: AbortSignal;
	method?: TMethods;
	body?: any;
}

// this form is required by Rocket.Chat's parser in "app/statistics/server/lib/UAParserCustom.js"
export const headers: CustomHeaders = {
	'User-Agent': `RC Mobile; ${
		Platform.OS
	} ${DeviceInfo.getSystemVersion()}; v${DeviceInfo.getVersion()} (${DeviceInfo.getBuildNumber()})`
};

export const setBasicAuth = (basicAuth: string | null): void => {
	sdk.setBasicAuth(basicAuth);
};
export const BASIC_AUTH_KEY = 'BASIC_AUTH_KEY';

export default (url: string, options: IOptions = {}): Promise<Response> => {
	const customOptions = { ...options, headers: { ...sdk.getHeaders(), ...(options.headers || {}) } };
	return fetch(url, customOptions);
};
