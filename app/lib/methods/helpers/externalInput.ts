import { NativeModules } from 'react-native';

const ExternalInput = NativeModules.ExternalInput as { isExternalKeyboardConnected?: () => boolean } | undefined;

export const isExternalKeyboardConnected = (): boolean => {
	if (!ExternalInput?.isExternalKeyboardConnected) {
		return false;
	}
	return Boolean(ExternalInput.isExternalKeyboardConnected());
};
