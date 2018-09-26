import DeviceInfo from 'react-native-device-info';

const NOTCH_DEVICES = ['iPhone X', 'iPhone XS', 'iPhone XS Max', 'iPhone XR'];

export default {
	isNotch: () => NOTCH_DEVICES.includes(DeviceInfo.getModel()),
	getBrand: () => DeviceInfo.getBrand(),
	getReadableVersion: () => DeviceInfo.getReadableVersion()
};
