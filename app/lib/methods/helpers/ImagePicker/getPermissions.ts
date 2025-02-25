import { Linking } from 'react-native';

import ImagePicker from './ImagePicker';
import { isIOS } from '../deviceInfo';

export const getPermissions = async (type: 'camera' | 'library') => {
	// Doesn't need permission to read
	if (isIOS && type === 'library') {
		return Promise.resolve();
	}

	const method = type === 'camera' ? 'requestCameraPermissionsAsync' : 'requestMediaLibraryPermissionsAsync';
	const requestResult = await ImagePicker[method]();
	if (!requestResult.canAskAgain) {
		Linking.openURL('app-settings:');
		return Promise.reject();
	}
	if (!requestResult.granted) {
		return Promise.reject();
	}
	return Promise.resolve();
};
