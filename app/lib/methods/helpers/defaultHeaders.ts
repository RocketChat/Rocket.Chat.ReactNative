import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

export interface DefaultHeaders {
	'User-Agent'?: string;
	Authorization?: string;
	'Content-Type'?: string;
	'X-Auth-Token'?: string;
	'X-User-Id'?: string;
}

// this form is required by Rocket.Chat's parser in "app/statistics/server/lib/UAParserCustom.js"
export const headers: DefaultHeaders = {
	'User-Agent': `RC Mobile; ${
		Platform.OS
	} ${DeviceInfo.getSystemVersion()}; v${DeviceInfo.getVersion()} (${DeviceInfo.getBuildNumber()})`
};
