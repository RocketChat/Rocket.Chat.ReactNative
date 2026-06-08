import { Alert, PermissionsAndroid, Platform } from 'react-native';
import { Audio } from 'expo-av';

import I18n from '../../i18n';
import log from './helpers/log';
import { openAppSettings } from './helpers/openAppSettings';
import { isInActiveVoipCall } from '../services/voip/isInActiveVoipCall';

export type VoipCallPermissionResult = {
	granted: boolean;
	canAskAgain: boolean;
	/**
	 * Whether the OS presented its permission dialog and the user actively acted on it this call.
	 * Only meaningful when `granted` is false — it lets `preAcquireVoipMicPermission` surface the
	 * denied alert on a *fresh* denial only, never on a relaunch where no dialog was shown.
	 */
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
		// A throw here (e.g. Android `request` when not attached to an Activity on a locked/backgrounded
		// answer) must not escape: callers would swallow it and the call would hang until the 10s
		// signaling timeout. Treat a failed permission check as denied so the call ends promptly.
		log(error);
		return { granted: false, canAskAgain: false, prompted: false };
	}
};

/**
 * Check-only microphone gate for the incoming-answer path. Never prompts: at answer time the app
 * may be locked or backgrounded (CallKit/Telecom UI up), where a permission dialog is impossible.
 * Returns whether the mic is currently granted; a throw resolves to `false` so the caller rejects
 * the call rather than hanging. The permission is pre-acquired at session init (see
 * `preAcquireVoipMicPermission`).
 */
export const hasVoipCallPermission = async (): Promise<boolean> => {
	try {
		if (Platform.OS === 'android') {
			return await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
		}
		const { granted } = await Audio.getPermissionsAsync();
		return granted;
	} catch (error) {
		log(error);
		return false;
	}
};

/**
 * Pre-acquire the microphone at session init (login → VoIP init), while the app is foreground and a
 * permission dialog can actually be shown. Fire-and-forget from the login flow. Suppressed when a
 * call is active/being reconciled so we never pop a dialog over a ringing call. The denied alert is
 * surfaced only on a fresh denial (a dialog the user just acted on); a relaunch where the mic is
 * already denied shows nothing — the outgoing path re-nudges in context. On Android the OS may
 * re-show its own dialog on each cold start until the user grants or picks "don't ask again".
 */
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
