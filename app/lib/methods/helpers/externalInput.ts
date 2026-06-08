import { NativeModules } from 'react-native';

const ExternalInput = NativeModules.ExternalInput as
	| {
			isExternalKeyboardConnected?: () => boolean;
			shouldForceSoftKeyboard?: () => boolean;
			showSoftInput?: () => void;
	  }
	| undefined;

export const isExternalKeyboardConnected = (): boolean => {
	if (!ExternalInput?.isExternalKeyboardConnected) {
		return false;
	}
	return Boolean(ExternalInput.isExternalKeyboardConnected());
};

export const shouldForceSoftKeyboard = (): boolean => {
	if (!ExternalInput?.shouldForceSoftKeyboard) {
		return false;
	}
	return Boolean(ExternalInput.shouldForceSoftKeyboard());
};

export const showSoftInput = (): void => {
	ExternalInput?.showSoftInput?.();
};
