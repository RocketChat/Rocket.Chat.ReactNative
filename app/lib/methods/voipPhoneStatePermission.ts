import { PermissionsAndroid } from 'react-native';

import i18n from '../../i18n';
import { isAndroid } from './helpers';

let askedThisSession = false;

export const requestPhoneStatePermission = (): void => {
	if (!isAndroid) {
		return;
	}
	if (askedThisSession) {
		return;
	}
	askedThisSession = true;

	PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE, {
		buttonPositive: i18n.t('Ok'),
		message: i18n.t('Phone_state_permission_message'),
		title: i18n.t('Phone_state_permission_title')
	});
};
