import mockDeviceInfo from 'react-native-device-info/jest/react-native-device-info-mock';

mockDeviceInfo.getSystemVersion = jest.fn(() => '14.0');
mockDeviceInfo.getVersion = jest.fn(() => '1.0.0');
mockDeviceInfo.getBuildNumber = jest.fn(() => '1');

export default mockDeviceInfo;
