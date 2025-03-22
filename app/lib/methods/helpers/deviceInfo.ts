import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

export const hasNotch = DeviceInfo.hasNotch();
export const isIOS = Platform.OS === 'ios';
export const isAndroid = !isIOS;
export const getReadableVersion = DeviceInfo.getReadableVersion();
export const getBundleId = DeviceInfo.getBundleId();
export const getDeviceModel = DeviceInfo.getModel();

// Theme is supported by system on iOS 13+ or Android 10+
export const supportSystemTheme = (): boolean => {
	const systemVersion = parseInt(DeviceInfo.getSystemVersion(), 10);
	return systemVersion >= (isIOS ? 13 : 10);
};

// Tablet info
export const isTablet = DeviceInfo.isTablet();
