import { DeviceEventEmitter, type EmitterSubscription } from 'react-native';

import I18n from '~/i18n';
import { isAndroid } from '~/lib/methods/helpers';
import log from '~/lib/methods/helpers/log';
import NativeConferenceCallAndroid from '~/lib/native/NativeConferenceCallAndroid';

const NOTIFICATION_ACTION_EVENT = 'ConferenceNotificationAction';

export type TConferenceNotificationAction = 'toggleMic' | 'leave';

export const updateConferenceNotification = (micEnabled: boolean): void => {
	if (!isAndroid || !NativeConferenceCallAndroid) {
		return;
	}
	NativeConferenceCallAndroid.updateConferenceCallNotification(
		micEnabled,
		I18n.t('Mute'),
		I18n.t('Unmute'),
		I18n.t('Leave_call')
	);
};

export const onConferenceNotificationAction = (listener: (action: TConferenceNotificationAction) => void): EmitterSubscription =>
	DeviceEventEmitter.addListener(NOTIFICATION_ACTION_EVENT, listener);

export const startConferenceForegroundService = async (micEnabled: boolean): Promise<void> => {
	if (!isAndroid || !NativeConferenceCallAndroid) {
		return;
	}
	try {
		updateConferenceNotification(micEnabled);
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
