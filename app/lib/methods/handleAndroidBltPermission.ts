import { PermissionsAndroid, type Permission } from 'react-native';
import DeviceInfo from 'react-native-device-info';

import { isAndroid } from './helpers';

const handleBltPermission = async (): Promise<Permission[]> => {
	const apiLevel = await DeviceInfo.getApiLevel();
	if (apiLevel >= 31) {
		return [PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT, PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN];
	}
	return [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
};

export const handleAndroidBltPermission = async (): Promise<void> => {
	if (isAndroid) {
		const bltPermission = await handleBltPermission();
		await PermissionsAndroid.requestMultiple(bltPermission);
	}
};
