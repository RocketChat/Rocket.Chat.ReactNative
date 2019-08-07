import { NativeModules } from 'react-native';

const { HTTPRequestHandler } = NativeModules;

export default {
	setCertificateInfo: (path, password) => {
		HTTPRequestHandler.setCertInfo(path, password);
	}
};
