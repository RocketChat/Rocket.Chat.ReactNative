import { Platform } from 'react-native';
import VersionNumber from 'react-native-version-number';

export const headers = { 'User-Agent': `RC-RN Mobile/${ VersionNumber.appVersion } (build: ${ VersionNumber.buildVersion }; os: ${ Platform.OS } ${ Platform.Version })` };

export default (url, options = {}) => {
	let customOptions = { ...options, headers };
	if (options && options.headers) {
		customOptions = { ...customOptions, headers: { ...options.headers, ...headers } };
	}
	return fetch(url, customOptions);
};
