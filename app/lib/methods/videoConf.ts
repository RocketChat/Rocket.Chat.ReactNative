import i18n from '../../i18n';
import { isConferenceWindowEnabled } from '../hooks/useConferenceWindow';
import navigation from '../navigation/appNavigation';
import { videoConferenceJoin } from '../services/restApi';
import { showErrorAlert } from './helpers';
import log from './helpers/log';
import openLink from './helpers/openLink';
import { handleAndroidBltPermission } from './handleAndroidBltPermission';
import { openConferenceCall } from './openConferenceCall';

export const videoConfJoin = async (callId: string, cam?: boolean, mic?: boolean, fromPush?: boolean): Promise<void> => {
	try {
		if (isConferenceWindowEnabled()) {
			await openConferenceCall({ callId });
			return;
		}

		const result = await videoConferenceJoin(callId, cam, mic);
		if (result.success) {
			const { url, providerName } = result;
			if (providerName === 'jitsi' && url) {
				await handleAndroidBltPermission();
				navigation.navigate('JitsiMeetView', { url, onlyAudio: !cam, videoConf: true });
			} else if (url) {
				openLink(url);
			} else {
				showErrorAlert(i18n.t(fromPush ? 'Missed_call' : 'error-init-video-conf'));
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
