import I18n from '~/i18n';
import { showConfirmationAlert, showErrorAlert } from '~/lib/methods/helpers/info';
import openLink from '~/lib/methods/helpers/openLink';
import log from '~/lib/methods/helpers/log';
import Navigation from '~/lib/navigation/appNavigation';
import { mediaCallsEscalate } from '~/lib/services/restApi';
import { usePexipCallStore } from '~/lib/services/videoConf/usePexipCallStore';
import { useCallStore } from './useCallStore';

let inFlight = false;

const executeEscalation = async (callId: string): Promise<void> => {
	if (inFlight) {
		return;
	}
	inFlight = true;
	try {
		const result = await mediaCallsEscalate(callId);
		if (!result.success) {
			throw new Error('media-calls.escalate failed');
		}
		const { url, providerName } = result;
		// The OS call session owns the microphone, so the VoIP call has to end before the conference can use it.
		const { callId: currentCallId, focused, endCall, roomId } = useCallStore.getState();
		if (currentCallId === callId) {
			endCall();
			if (focused) {
				Navigation.back();
			}
		}
		if (providerName === 'jitsi') {
			Navigation.navigate('JitsiMeetView', { url, onlyAudio: false, videoConf: true });
		} else if (providerName.toLowerCase().includes('pexip')) {
			usePexipCallStore.getState().open({ callId: result.callId ?? callId, url, rid: roomId ?? undefined });
		} else {
			openLink(url);
		}
	} catch (error) {
		log(error);
		showErrorAlert(I18n.t('Unable_to_start_video_call'));
	} finally {
		inFlight = false;
	}
};

/** Asks for confirmation, then escalates the current VoIP call to a video conference ends the voice call and joins the conference. */
export function escalateToVideo(): void {
	const { callId } = useCallStore.getState();
	if (!callId) {
		return;
	}
	showConfirmationAlert({
		title: I18n.t('Video_escalation_modal_title'),
		message: I18n.t('Video_escalation_modal_description'),
		confirmationText: I18n.t('Start_video_call'),
		onPress: () => executeEscalation(callId)
	});
}
