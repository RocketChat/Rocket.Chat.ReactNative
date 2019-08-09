import { NativeModules } from 'react-native';

const { HTTPRequestHandler, WebSocketModule } = NativeModules;

export default {
	setCertificateInfo: (server, path, password) => {
		WebSocketModule.sslPinning(server, path, password);
		HTTPRequestHandler.setCertInfo(path, password);
	}
};
