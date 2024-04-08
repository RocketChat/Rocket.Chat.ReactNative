import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

export interface ICustomHeaders {
	'User-Agent'?: string;
	Authorization?: string;
	'Content-Type'?: string;
	'X-Auth-Token'?: string;
	'X-User-Id'?: string;
	'x-2fa-code'?: string;
	'x-2fa-method'?: string;
}

const defaultHeaders = {
	'User-Agent': `RC Mobile; ${
		Platform.OS
	} ${DeviceInfo.getSystemVersion()}; v${DeviceInfo.getVersion()} (${DeviceInfo.getBuildNumber()})`
};

class CustomHeaders {
	headers: ICustomHeaders;
	constructor() {
		this.headers = { ...defaultHeaders };
	}

	setHeaders(headers: ICustomHeaders) {
		this.headers = { ...this.headers, ...headers };
	}

	getHeaders() {
		return this.headers as { [key: string]: string };
	}

	resetHeaders() {
		this.headers = { ...defaultHeaders };
	}
}

const customHeaders = new CustomHeaders();

export default customHeaders;
