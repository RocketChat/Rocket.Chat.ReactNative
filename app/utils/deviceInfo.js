import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

import { MIN_WIDTH_SPLIT_LAYOUT } from '../constants/tablet';

export const hasNotch = DeviceInfo.hasNotch();
export const isIOS = Platform.OS === 'ios';
export const isAndroid = !isIOS;
export const getReadableVersion = DeviceInfo.getReadableVersion();
export const getBundleId = DeviceInfo.getBundleId();
export const getDeviceModel = DeviceInfo.getModel();

// Theme is supported by system on iOS 13+ or Android 10+
export const supportSystemTheme = () => {
	const systemVersion = parseInt(DeviceInfo.getSystemVersion(), 10);
	return systemVersion >= (isIOS ? 13 : 10);
};

// Tablet info
export const isTablet = DeviceInfo.isTablet();

// We need to use this when app is used on splitview with another app
// to handle cases on app view not-larger sufficient to show splited views (room list/room)
// https://github.com/RocketChat/Rocket.Chat.ReactNative/pull/1300#discussion_r341405245
let _width = null;
export const setWidth = width => _width = width;
export const isSplited = () => isTablet && _width > MIN_WIDTH_SPLIT_LAYOUT;
