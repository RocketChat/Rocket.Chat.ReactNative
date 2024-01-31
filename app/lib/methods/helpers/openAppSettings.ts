import { Linking } from 'react-native';

import { isIOS } from './deviceInfo';

export const openAppSettings = (): void => {
	if (isIOS) {
		Linking.openURL('app-settings:');
	} else {
		Linking.openSettings();
	}
};
