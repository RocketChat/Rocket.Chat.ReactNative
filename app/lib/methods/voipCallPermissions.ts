import { PermissionsAndroid } from 'react-native';

import { isAndroid } from './helpers';

export const requestVoipCallPermissions = async (): Promise<boolean> => {
	if (!isAndroid) {
		return true;
	}
	const results = await PermissionsAndroid.requestMultiple([
		PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
		PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
	]);
	// READ_PHONE_STATE only enhances Telecom integration; native falls back without it.
	return results[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;
};
