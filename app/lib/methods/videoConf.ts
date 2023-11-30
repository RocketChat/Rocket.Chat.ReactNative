import { PermissionsAndroid, Permission } from 'react-native';
import DeviceInfo from 'react-native-device-info';

import i18n from '../../i18n';
import navigation from '../navigation/appNavigation';
import { Services } from '../services';
import { isAndroid, showErrorAlert } from './helpers';
import log from './helpers/log';
import openLink from './helpers/openLink';

const handleBltPermission = async (): Promise<Permission[]> => {
	const systemVersion = await DeviceInfo.getApiLevel();
	if (systemVersion <= 28) {
		return [PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT, PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN];
	}
	if (systemVersion === 29) {
		return [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
	}
	return [PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION];
};

export const handleAndroidBltPermission = async (): Promise<void> => {
	if (isAndroid) {
		const bltPermission = await handleBltPermission();
		await PermissionsAndroid.requestMultiple(bltPermission);
	}
};

export const videoConfJoin = async (callId: string, cam?: boolean, mic?: boolean, fromPush?: boolean): Promise<void> => {
	try {
		const result = await Services.videoConferenceJoin(callId, cam, mic);
		if (result.success) {
			const { url, providerName } = result;
			if (providerName === 'jitsi') {
				navigation.navigate('JitsiMeetView', { url, onlyAudio: !cam, videoConf: true });
			} else {
				openLink(url);
			}
		}
	} catch (e) {
		if (fromPush) {
			showErrorAlert(i18n.t('Missed_call'));
		} else {
			showErrorAlert(i18n.t('error-init-video-conf'));
		}
		log(e);
	}
};
