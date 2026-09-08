import { PermissionsAndroid, type Permission } from 'react-native';
import DeviceInfo from 'react-native-device-info';

import { isAndroid } from './helpers';

const handleBltPermission = async (): Promise<Permission[]> => {
	const systemVersion = await DeviceInfo.getApiLevel();
	if (systemVersion <= 28) {
		return [PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT, PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN];
	}
	if (systemVersion === 29) {
		return [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
	}
	return [PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION];
};

export const handleAndroidBltPermission = async (): Promise<void> => {
	if (isAndroid) {
		const bltPermission = await handleBltPermission();
		await PermissionsAndroid.requestMultiple(bltPermission);
	}
};
