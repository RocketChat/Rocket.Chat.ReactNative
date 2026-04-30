import { PermissionsAndroid } from 'react-native';

import { isAndroid } from './helpers';

export const requestVoipCallPermissions = async (): Promise<boolean> => {
	if (!isAndroid) {
		return true;
	}
	const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
	return result === PermissionsAndroid.RESULTS.GRANTED;
};
