import { NativeEventEmitter, NativeModules } from 'react-native';

const { A11yEventEmitter } = NativeModules;
const a11yEmitter = new NativeEventEmitter(A11yEventEmitter);

export const subscribeToAccessibilityEvents = () => {
	const focusChangeSubscription = a11yEmitter.addListener('onAccessibilityFocusChange', event => {
		console.log('Focus changed:', event);
	});

	const voiceOverStatusSubscription = a11yEmitter.addListener('onVoiceOverStatusChanged', event => {
		console.log('VoiceOver status changed:', event);
	});

	return () => {
		focusChangeSubscription.remove();
		voiceOverStatusSubscription.remove();
	};
};
