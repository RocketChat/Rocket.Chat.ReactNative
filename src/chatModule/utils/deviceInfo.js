// import DeviceInfo from 'react-native-device-info';

export default {
  isNotch: () => false, //() => DeviceInfo.getModel() === 'iPhone X',
  getBrand: () => "Apple", //() => DeviceInfo.getBrand(),
  getReadableVersion: () => "anyway" //() => DeviceInfo.getReadableVersion()
};
