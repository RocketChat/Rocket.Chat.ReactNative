import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

const NOTCH_DEVICES = ['iPhone X', 'iPhone XS', 'iPhone XS Max', 'iPhone XR'];

export const isNotch = NOTCH_DEVICES.includes(DeviceInfo.getModel());
export const isIOS = Platform.OS === 'ios';
export const isAndroid = !isIOS;
export const getReadableVersion = DeviceInfo.getReadableVersion();
export const getBundleId = DeviceInfo.getBundleId();

export default {
	isNotch,
	isIOS,
	isAndroid,
	getReadableVersion,
	getBundleId
};
