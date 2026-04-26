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
	return (
		results[PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE] === PermissionsAndroid.RESULTS.GRANTED &&
		results[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED
	);
};
