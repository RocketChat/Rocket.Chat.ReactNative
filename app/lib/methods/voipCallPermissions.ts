import { Alert, PermissionsAndroid, Platform } from 'react-native';
import { Audio } from 'expo-av';

import I18n from '../../i18n';
import log from './helpers/log';
import { openAppSettings } from './helpers/openAppSettings';

export type VoipCallPermissionResult = {
	granted: boolean;
	canAskAgain: boolean;
};

export const requestVoipCallPermissions = async (): Promise<VoipCallPermissionResult> => {
	try {
		if (Platform.OS === 'android') {
			const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
			if (result === PermissionsAndroid.RESULTS.GRANTED) {
				return { granted: true, canAskAgain: true };
			}
			return {
				granted: false,
				canAskAgain: result !== PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
			};
		}

		const { granted, canAskAgain } = await Audio.getPermissionsAsync();
		if (granted) {
			return { granted: true, canAskAgain: true };
		}
		// `canAskAgain` is true while the status is undetermined, so this also covers the first prompt.
		if (canAskAgain) {
			const requested = await Audio.requestPermissionsAsync();
			return {
				granted: requested.granted,
				canAskAgain: requested.canAskAgain
			};
		}
		return { granted: false, canAskAgain: false };
	} catch (error) {
		// A throw here (e.g. Android `request` when not attached to an Activity on a locked/backgrounded
		// answer) must not escape: `answerCall` would swallow it and the call would hang until the 10s
		// signaling timeout. Treat a failed permission check as denied so the call ends promptly.
		log(error);
		return { granted: false, canAskAgain: false };
	}
};

export const showVoipMicrophoneDeniedAlert = (canAskAgain: boolean): void => {
	// Same title/message either way; only the buttons and dismissibility differ. When we can ask
	// again a dismiss-only alert is enough; when permanently denied we route the user to Settings.
	Alert.alert(
		I18n.t('Microphone_access_needed_to_record_audio'),
		I18n.t('Go_to_your_device_settings_and_allow_microphone'),
		canAskAgain
			? [{ text: I18n.t('Ok') }]
			: [
					{ text: I18n.t('Cancel'), style: 'cancel' },
					{ text: I18n.t('Settings'), onPress: openAppSettings }
			  ],
		{ cancelable: canAskAgain }
	);
};
