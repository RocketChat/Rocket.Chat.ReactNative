import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

// this form is required by Rocket.Chat's parser in "app/statistics/server/lib/UAParserCustom.js"
export const headers = { 'User-Agent': `RC Mobile; ${ Platform.OS } ${ DeviceInfo.getSystemVersion() }; v${ DeviceInfo.getVersion() } (${ DeviceInfo.getBuildNumber() })` };

export default (url, options = {}) => {
	let customOptions = { ...options, headers };
	if (options && options.headers) {
		customOptions = { ...customOptions, headers: { ...options.headers, ...headers } };
	}
	return fetch(url, customOptions);
};
