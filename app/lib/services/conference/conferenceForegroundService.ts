import { isAndroid } from '~/lib/methods/helpers';
import log from '~/lib/methods/helpers/log';
import NativeConferenceCallAndroid from '~/lib/native/NativeConferenceCallAndroid';

export const startConferenceForegroundService = async (): Promise<void> => {
	if (!isAndroid || !NativeConferenceCallAndroid) {
		return;
	}
	try {
		await NativeConferenceCallAndroid.startConferenceCallService();
	} catch (error) {
		log(error);
	}
};

export const stopConferenceForegroundService = (): void => {
	if (!isAndroid || !NativeConferenceCallAndroid) {
		return;
	}
	NativeConferenceCallAndroid.stopConferenceCallService();
};
