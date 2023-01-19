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

export const videoConfJoin = async (callId: string, cam: boolean) => {
	try {
		const result = await Services.videoConferenceJoin(callId, cam);
		if (result.success) {
			if (isAndroid) {
				const bltPermission = await handleBltPermission();
				await PermissionsAndroid.requestMultiple([
					PermissionsAndroid.PERMISSIONS.CAMERA,
					PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
					...bltPermission
				]);
			}
			const { url, providerName } = result;
			if (providerName === 'jitsi') {
				navigation.navigate('JitsiMeetView', { url, onlyAudio: !cam, videoConf: true });
			} else {
				openLink(url);
			}
		}
	} catch (e) {
		showErrorAlert(i18n.t('error-init-video-conf'));
		log(e);
	}
};

export const videoConfStartAndJoin = async (rid: string, cam: boolean) => {
	try {
		const videoConfResponse: any = await Services.videoConferenceStart(rid);
		if (videoConfResponse.success) {
			videoConfJoin(videoConfResponse.data.callId, cam);
		}
	} catch (e) {
		showErrorAlert(i18n.t('error-init-video-conf'));
		log(e);
	}
};
