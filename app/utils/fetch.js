import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

export const headers = { 'User-Agent': `RC-RN Mobile/${ DeviceInfo.getVersion() } (build: ${ DeviceInfo.getBuildNumber() }; os: ${ Platform.OS } ${ DeviceInfo.getSystemVersion() })` };

export default (url, options = {}) => {
	let customOptions = { ...options, headers };
	if (options && options.headers) {
		customOptions = { ...customOptions, headers: { ...options.headers, ...headers } };
	}
	return fetch(url, customOptions);
};
