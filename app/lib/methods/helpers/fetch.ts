import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { settings as RocketChatSettings } from '@rocket.chat/sdk';

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
	skipCustomHeaders?: boolean;
}

// this form is required by Rocket.Chat's parser in "app/statistics/server/lib/UAParserCustom.js"
export const headers: CustomHeaders = {
	'User-Agent': `RC Mobile; ${
		Platform.OS
	} ${DeviceInfo.getSystemVersion()}; v${DeviceInfo.getVersion()} (${DeviceInfo.getBuildNumber()})`
};

let _basicAuth;
export const setBasicAuth = (basicAuth: string | null): void => {
	_basicAuth = basicAuth;
	if (basicAuth) {
		RocketChatSettings.customHeaders = { ...headers, Authorization: `Basic ${_basicAuth}` };
	} else {
		RocketChatSettings.customHeaders = headers;
	}
};
export const BASIC_AUTH_KEY = 'BASIC_AUTH_KEY';

RocketChatSettings.customHeaders = headers;

const withoutEmptyValues = (requestHeaders: CustomHeaders): Record<string, string> =>
	Object.fromEntries(Object.entries(requestHeaders).filter((entry): entry is [string, string] => typeof entry[1] === 'string'));

export default (url: string, options: IOptions = {}): Promise<Response> => {
	const { skipCustomHeaders, ...fetchOptions } = options;
	const customOptions = {
		...fetchOptions,
		headers: withoutEmptyValues({ ...options.headers, ...(skipCustomHeaders ? headers : RocketChatSettings.customHeaders) })
	};
	return fetch(url, customOptions);
};
