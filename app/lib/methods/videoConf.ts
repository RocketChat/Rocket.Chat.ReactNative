import i18n from '~/i18n';
import navigation from '../navigation/appNavigation';
import { videoConferenceInfo, videoConferenceJoin } from '../services/restApi';
import { showErrorAlert } from './helpers';
import log from './helpers/log';
import openLink from './helpers/openLink';
import { openConferenceCall } from './openConferenceCall';
import { requestVoipCallPermissions } from './voipCallPermissions';

const getCallProvider = async (callId: string): Promise<string> => {
	const info = await videoConferenceInfo(callId);
	if (!info.success) {
		throw new Error(`Could not look up video conference ${callId}`);
	}
	return info.providerName;
};

export const videoConfJoin = async (
	callId: string,
	cam?: boolean,
	mic?: boolean,
	{ fromPush, rid }: { fromPush?: boolean; rid?: string } = {}
): Promise<void> => {
	try {
		if ((await getCallProvider(callId)) === 'livekit') {
			await openConferenceCall({ callId, rid });
			return;
		}

		const result = await videoConferenceJoin(callId, cam, mic);
		if (result.success) {
			const { url, providerName } = result;
			if (providerName === 'jitsi' && url) {
				// Legacy Jitsi path is a WebView too, so BT headset audio needs the same grant. A denial
				// must not block the call, the speaker still works.
				await requestVoipCallPermissions().catch(log);
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
