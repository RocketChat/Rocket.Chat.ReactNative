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
		const { callId: currentCallId, focused, endCall, toggleFocus, roomId } = useCallStore.getState();
		const isCurrentCall = currentCallId === callId;
		if (providerName.toLowerCase().includes('pexip')) {
			// The server hangs the voice call up once we join the conference, so the peer is never dropped mid-handoff.
			if (isCurrentCall && focused) {
				toggleFocus();
			}
			usePexipCallStore.getState().open({ callId: result.callId ?? callId, url, rid: roomId ?? undefined });
			return;
		}
		// Other providers never end the voice call for us, and the OS call session would keep the microphone.
		if (isCurrentCall) {
			endCall();
			if (focused) {
				Navigation.back();
			}
		}
		if (providerName === 'jitsi') {
			Navigation.navigate('JitsiMeetView', { url, onlyAudio: false, videoConf: true });
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

/**
 * Escalates the current VoIP call to a video conference and joins it. Asks for confirmation first, unless the call
 * was already escalated (by either side), in which case it just joins the existing conference.
 */
export function escalateToVideo(): void {
	const { callId, escalated } = useCallStore.getState();
	if (!callId) {
		return;
	}
	if (escalated) {
		executeEscalation(callId);
		return;
	}
	showConfirmationAlert({
		title: I18n.t('Video_escalation_modal_title'),
		message: I18n.t('Video_escalation_modal_description'),
		confirmationText: I18n.t('Start_video_call'),
		onPress: () => executeEscalation(callId)
	});
}
