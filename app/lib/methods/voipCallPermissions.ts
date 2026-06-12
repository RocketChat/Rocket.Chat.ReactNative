import { Alert, PermissionsAndroid, Platform } from 'react-native';
import { Audio } from 'expo-av';

import I18n from '../../i18n';
import log from './helpers/log';
import { openAppSettings } from './helpers/openAppSettings';
import { isInActiveVoipCall } from '../services/voip/isInActiveVoipCall';

export type VoipCallPermissionResult = {
	granted: boolean;
	canAskAgain: boolean;
	/** True only when the OS dialog was actually shown — a fresh denial, not a relaunch with the mic already denied. */
	prompted: boolean;
};

export const requestVoipCallPermissions = async (): Promise<VoipCallPermissionResult> => {
	try {
		if (Platform.OS === 'android') {
			const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
			if (result === PermissionsAndroid.RESULTS.GRANTED) {
				return { granted: true, canAskAgain: true, prompted: false };
			}
			// DENIED means the dialog was shown and declined (a fresh denial); NEVER_ASK_AGAIN returns
			// without showing a dialog, so it is not a fresh prompt the user just acted on.
			const denied = result === PermissionsAndroid.RESULTS.DENIED;
			return { granted: false, canAskAgain: denied, prompted: denied };
		}

		const { granted, canAskAgain } = await Audio.getPermissionsAsync();
		if (granted) {
			return { granted: true, canAskAgain: true, prompted: false };
		}
		// `canAskAgain` is true while the status is undetermined, so this also covers the first prompt.
		if (canAskAgain) {
			const requested = await Audio.requestPermissionsAsync();
			return {
				granted: requested.granted,
				canAskAgain: requested.canAskAgain,
				prompted: true
			};
		}
		return { granted: false, canAskAgain: false, prompted: false };
	} catch (error) {
		// A throw (e.g. activity detached) is transient, not a permission verdict — denied but re-promptable.
		log(error);
		return { granted: false, canAskAgain: true, prompted: false };
	}
};

/** Check-only gate for the incoming-answer path — never prompts; mic is pre-acquired at session init. */
export const hasVoipCallPermission = async (): Promise<boolean> => {
	try {
		if (Platform.OS === 'android') {
			return await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
		}
		const { granted } = await Audio.getPermissionsAsync();
		return granted;
	} catch (error) {
		// Throw → false so the caller ends the call instead of hanging until the signaling timeout.
		log(error);
		return false;
	}
};

/** Pre-acquires the mic at session init, while the app is foregrounded and a dialog is possible — an incoming call on a locked device can't prompt.
 * Alerts only on a fresh denial; skipped during an active call. */
export const preAcquireVoipMicPermission = async (): Promise<void> => {
	if (isInActiveVoipCall()) {
		return;
	}
	const { granted, canAskAgain, prompted } = await requestVoipCallPermissions();
	if (!granted && prompted) {
		showVoipMicrophoneDeniedAlert(canAskAgain);
	}
};

export const showVoipMicrophoneDeniedAlert = (canAskAgain: boolean): void => {
	// Same title/message either way; only the buttons and dismissibility differ. When we can ask
	// again a dismiss-only alert is enough; when permanently denied we route the user to Settings.
	Alert.alert(
		I18n.t('Microphone_access_needed_for_voice_calls'),
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
