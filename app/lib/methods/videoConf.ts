import i18n from '../../i18n';
import navigation from '../navigation/appNavigation';
import { videoConferenceJoin } from '../services/restApi';
import { showErrorAlert } from './helpers';
import { isConferenceWindowEnabled } from './helpers/isConferenceWindowEnabled';
import log from './helpers/log';
import openLink from './helpers/openLink';
import { handleAndroidBltPermission } from './handleAndroidBltPermission';
import { openConferenceCall } from './openConferenceCall';

// `rid` lets the conference window keep a preflight page already open for that room.
export const videoConfJoin = async (
	callId: string,
	cam?: boolean,
	mic?: boolean,
	{ fromPush, rid }: { fromPush?: boolean; rid?: string } = {}
): Promise<void> => {
	try {
		if (isConferenceWindowEnabled()) {
			await openConferenceCall({ callId, rid });
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
