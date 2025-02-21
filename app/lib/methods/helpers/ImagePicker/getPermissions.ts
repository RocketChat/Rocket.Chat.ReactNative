import { Linking } from 'react-native';

import ImagePicker from './ImagePicker';

export const getPermissions = async (type: 'camera' | 'library') => {
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
