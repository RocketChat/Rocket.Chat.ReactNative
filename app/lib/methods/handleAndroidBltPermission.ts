import { PermissionsAndroid, type Permission } from 'react-native';
import DeviceInfo from 'react-native-device-info';

import { isAndroid } from './helpers';

const handleBltPermission = async (): Promise<Permission[]> => {
	const apiLevel = await DeviceInfo.getApiLevel();
	if (apiLevel >= 31) {
		return [PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT, PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN];
	}
	// Only API 29/30 gated Bluetooth discovery behind location.
	if (apiLevel >= 29) {
		return [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
	}
	return [];
};

export const handleAndroidBltPermission = async (): Promise<void> => {
	if (isAndroid) {
		const bltPermission = await handleBltPermission();
		if (bltPermission.length) {
			await PermissionsAndroid.requestMultiple(bltPermission);
		}
	}
};
