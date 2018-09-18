import DeviceInfo from 'react-native-device-info';

export default {
	isNotch: () => DeviceInfo.getModel() === 'iPhone X',
	getBrand: () => DeviceInfo.getBrand(),
	getVersion: () => DeviceInfo.getVersion(),
	getBuildNumber: () => DeviceInfo.getBuildNumber()
};
