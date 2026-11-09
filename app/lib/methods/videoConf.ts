import i18n from '~/i18n';
import navigation from '../navigation/appNavigation';
import { videoConferenceGetCapabilities, videoConferenceJoin } from '../services/restApi';
import { showErrorAlert } from './helpers';
import log from './helpers/log';
import openLink from './helpers/openLink';
import { focusActivePexipCall, usePexipCallStore } from '../services/videoConf/usePexipCallStore';
import { store } from '../store/auxStore';
import { openConferenceCall } from './openConferenceCall';
import { requestVoipCallPermissions } from './voipCallPermissions';

const openJoinedCall = async ({
	callId,
	url,
	providerName,
	cam,
	rid
}: {
	callId: string;
	url: string;
	providerName: string;
	cam?: boolean;
	rid?: string;
}) => {
	if (providerName === 'jitsi') {
		// Legacy Jitsi path is a WebView too, so BT headset audio needs the same grant. A denial
		// must not block the call, the speaker still works.
		await requestVoipCallPermissions().catch(log);
		navigation.navigate('JitsiMeetView', { url, onlyAudio: !cam, videoConf: true });
		return;
	}
	if (providerName.toLowerCase().includes('pexip')) {
		usePexipCallStore.getState().open({ callId, url, rid, server: store.getState().server.server });
		return;
	}
	openLink(url);
};

export const videoConfJoin = async (
	callId: string,
	cam?: boolean,
	mic?: boolean,
	{ fromPush, rid }: { fromPush?: boolean; rid?: string } = {}
): Promise<void> => {
	if (focusActivePexipCall(callId)) return;
	const errorMessage = i18n.t(fromPush ? 'Missed_call' : 'error-init-video-conf');
	try {
		// Read-only: checking here doesn't post a join, which the embedded page does itself once it loads.
		const capabilities = await videoConferenceGetCapabilities();

		if (capabilities.success && capabilities.providerName === 'livekit') {
			await openConferenceCall({ callId, rid });
			return;
		}

		const result = await videoConferenceJoin(callId, cam, mic);
		if (!result.success) return;
		if (result.url) {
			await openJoinedCall({ callId, url: result.url, providerName: result.providerName, cam, rid });
		} else {
			showErrorAlert(errorMessage);
		}
	} catch (e) {
		showErrorAlert(errorMessage);
		log(e);
	}
};
