import { DeviceEventEmitter, type EmitterSubscription, NativeEventEmitter } from 'react-native';

import I18n from '~/i18n';
import { isAndroid, isIOS } from '~/lib/methods/helpers';
import log from '~/lib/methods/helpers/log';
import NativeConferenceCallAndroid from '~/lib/native/NativeConferenceCallAndroid';
import NativeConferenceLiveActivity from '~/lib/native/NativeConferenceLiveActivity';

const NOTIFICATION_ACTION_EVENT = 'ConferenceNotificationAction';

export type TConferenceNotificationAction = 'mute' | 'unmute' | 'leave';

const buttonLabels = () => ({ mute: I18n.t('Mute'), unmute: I18n.t('Unmute'), leave: I18n.t('Leave_call') });

export const updateConferenceCallNotification = (micEnabled: boolean): void => {
	if (isIOS) {
		NativeConferenceLiveActivity?.updateConferenceLiveActivity(micEnabled, buttonLabels());
	} else if (isAndroid) {
		NativeConferenceCallAndroid?.updateConferenceCallNotification(micEnabled, buttonLabels());
	}
};

export const onConferenceCallNotificationAction = (
	listener: (action: TConferenceNotificationAction) => void
): EmitterSubscription => {
	const emitter =
		isIOS && NativeConferenceLiveActivity ? new NativeEventEmitter(NativeConferenceLiveActivity) : DeviceEventEmitter;
	return emitter.addListener(NOTIFICATION_ACTION_EVENT, listener);
};

export const startConferenceCallNotification = async (micEnabled: boolean): Promise<void> => {
	if (isIOS) {
		NativeConferenceLiveActivity?.startConferenceLiveActivity(I18n.t('conference_call'), micEnabled, buttonLabels());
		return;
	}
	if (!isAndroid || !NativeConferenceCallAndroid) {
		return;
	}
	try {
		updateConferenceCallNotification(micEnabled);
		await NativeConferenceCallAndroid.startConferenceCallService();
	} catch (error) {
		log(error);
	}
};

export const stopConferenceCallNotification = (): void => {
	if (isIOS) {
		NativeConferenceLiveActivity?.endConferenceLiveActivity();
	} else if (isAndroid) {
		NativeConferenceCallAndroid?.stopConferenceCallService();
	}
};
