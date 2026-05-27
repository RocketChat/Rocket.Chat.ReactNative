import { Alert, PermissionsAndroid, Platform } from 'react-native';
import { Audio } from 'expo-av';
import { PermissionStatus } from 'expo-camera';

import I18n from '../../i18n';
import { openAppSettings } from './helpers/openAppSettings';

export type VoipCallPermissionResult = {
	granted: boolean;
	canAskAgain: boolean;
};

export const requestVoipCallPermissions = async (): Promise<VoipCallPermissionResult> => {
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

	const { granted, status, canAskAgain } = await Audio.getPermissionsAsync();
	if (granted) {
		return { granted: true, canAskAgain: true };
	}
	if (status === PermissionStatus.UNDETERMINED || canAskAgain) {
		const requested = await Audio.requestPermissionsAsync();
		return {
			granted: requested.granted,
			canAskAgain: requested.canAskAgain ?? false
		};
	}
	return { granted: false, canAskAgain: false };
};

export const showVoipMicrophoneDeniedAlert = (canAskAgain: boolean): void => {
	if (canAskAgain) {
		Alert.alert(
			I18n.t('Microphone_access_needed_to_record_audio'),
			I18n.t('Go_to_your_device_settings_and_allow_microphone'),
			[{ text: I18n.t('Ok') }],
			{ cancelable: true }
		);
		return;
	}

	Alert.alert(
		I18n.t('Microphone_access_needed_to_record_audio'),
		I18n.t('Go_to_your_device_settings_and_allow_microphone'),
		[
			{
				text: I18n.t('Cancel'),
				style: 'cancel'
			},
			{
				text: I18n.t('Settings'),
				onPress: openAppSettings
			}
		],
		{ cancelable: false }
	);
};
