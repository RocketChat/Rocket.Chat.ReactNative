import { Linking } from 'react-native';

import { isIOS } from './deviceInfo';
import log from './log';

export const openAppSettings = async(): Promise<void> => {
	try {
		if (isIOS) {
			await Linking.openURL('app-settings:');
		} else {
			await Linking.openSettings();
		}
	} catch(e) {
		log(e);
	}
};
