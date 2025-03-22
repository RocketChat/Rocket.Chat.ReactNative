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

export default (url: string, options: IOptions = {}): Promise<Response> => {
	let customOptions = { ...options, headers: RocketChatSettings.customHeaders };
	if (options && options.headers) {
		customOptions = { ...customOptions, headers: { ...options.headers, ...customOptions.headers } };
	}
	// TODO: Check if this really works and if anyone else has complained about this problem.
	// if (RocketChat.controller) {
	// 	// @ts-ignore
	// 	const { signal } = RocketChat.controller;
	// 	customOptions = { ...customOptions, signal };
	// }
	return fetch(url, customOptions);
};
