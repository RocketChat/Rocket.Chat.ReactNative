import { NativeModules, DeviceEventEmitter } from 'react-native';

const { A11YEventEmitter } = NativeModules;

export const subscribeToAccessibilityEvents = () => {
	console.log(A11YEventEmitter, NativeModules, 'nativeModules');
};

/* DeviceEventEmitter.addListener('onAccessibilityEvent', (event) => {
  console.log('Accessibility event received: ', event.message);
});

// Call the native method
A11YEventEmitter.sendAccessibilityEvent('Test accessibility event');
 */
