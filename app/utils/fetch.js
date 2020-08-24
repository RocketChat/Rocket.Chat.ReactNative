import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { settings as RocketChatSettings } from '@rocket.chat/sdk';
import RocketChat from '../lib/rocketchat';

// this form is required by Rocket.Chat's parser in "app/statistics/server/lib/UAParserCustom.js"
export const headers = {
	'User-Agent': `RC Mobile; ${ Platform.OS } ${ DeviceInfo.getSystemVersion() }; v${ DeviceInfo.getVersion() } (${ DeviceInfo.getBuildNumber() })`
};

let _basicAuth;
export const setBasicAuth = (basicAuth) => {
	_basicAuth = basicAuth;
	if (basicAuth) {
		RocketChatSettings.customHeaders = { ...headers, Authorization: `Basic ${ _basicAuth }` };
	} else {
		RocketChatSettings.customHeaders = headers;
	}
};
export const BASIC_AUTH_KEY = 'BASIC_AUTH_KEY';

RocketChatSettings.customHeaders = headers;

export default (url, options = {}) => {
	let customOptions = { ...options, headers: RocketChatSettings.customHeaders };
	if (options && options.headers) {
		customOptions = { ...customOptions, headers: { ...options.headers, ...customOptions.headers } };
	}
	if (RocketChat.controller) {
		const { signal } = RocketChat.controller;
		customOptions = { ...customOptions, signal };
	}
	return fetch(url, customOptions);
};
