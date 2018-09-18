import DeviceInfo from 'react-native-device-info';

export default {
	isNotch: () => DeviceInfo.getModel() === 'iPhone X',
	getBrand: () => DeviceInfo.getBrand(),
	getReadableVersion: () => DeviceInfo.getReadableVersion()
};
