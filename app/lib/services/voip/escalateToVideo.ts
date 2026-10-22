import I18n from '~/i18n';
import { showConfirmationAlert, showErrorAlert } from '~/lib/methods/helpers/info';
import openLink from '~/lib/methods/helpers/openLink';
import log from '~/lib/methods/helpers/log';
import Navigation from '~/lib/navigation/appNavigation';
import { videoConfJoin } from '~/lib/methods/videoConf';
import { mediaCallsEscalate, notifyUser, videoConferenceStart } from '~/lib/services/restApi';
import { store } from '~/lib/store/auxStore';
import { usePexipCallStore } from '~/lib/services/videoConf/usePexipCallStore';
import { supportsServerEscalation, useCallStore } from './useCallStore';

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
			usePexipCallStore.getState().open({
				callId: result.callId ?? callId,
				url,
				rid: roomId ?? undefined
			});
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
			Navigation.navigate('JitsiMeetView', {
				url,
				onlyAudio: false,
				videoConf: true
			});
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

const leaveVoiceCall = (): void => {
	const { focused, endCall } = useCallStore.getState();
	endCall();
	if (focused) {
		Navigation.back();
	}
};

// The server only escalates SIP calls; between two users we start a conference in their DM, without ringing, and tell
// the other user to switch to it too.
const switchToConference = async (rid: string): Promise<void> => {
	if (inFlight) {
		return;
	}
	inFlight = true;
	try {
		const result = await videoConferenceStart(rid, false);
		if (!result.success) {
			throw new Error('video-conference.start failed');
		}
		const { callId: conferenceId } = result.data;
		const { callId, contact } = useCallStore.getState();
		if (!callId || !contact.id) {
			return;
		}
		const userId = store.getState().login.user.id;
		await notifyUser(`${contact.id}/video-conference`, {
			action: 'escalate',
			params: { uid: userId, rid, callId: conferenceId }
		});
		leaveVoiceCall();
		await videoConfJoin(conferenceId, false, true, { rid });
	} catch (error) {
		log(error);
		showErrorAlert(I18n.t('Unable_to_start_video_call'));
	} finally {
		inFlight = false;
	}
};

/** The other user switched our voice call to a conference: leave the voice call and join it. */
export const joinConferenceFromPeer = async ({
	callId,
	rid,
	uid
}: {
	callId: string;
	rid: string;
	uid: string;
}): Promise<void> => {
	const { call, contact } = useCallStore.getState();
	if (!call || contact.id !== uid) {
		return;
	}
	leaveVoiceCall();
	await videoConfJoin(callId, false, true, { rid });
};

/**
 * Escalates the current VoIP call to a video conference and joins it. Asks for confirmation first, unless the call
 * was already escalated (by either side), in which case it just joins the existing conference.
 */
export function escalateToVideo(): void {
	const { call, callId, escalated, roomId } = useCallStore.getState();
	if (!callId) {
		return;
	}
	const serverEscalation = supportsServerEscalation(call);
	if (!serverEscalation && !roomId) {
		return;
	}
	if (escalated && serverEscalation) {
		executeEscalation(callId);
		return;
	}
	showConfirmationAlert({
		title: I18n.t('Video_escalation_modal_title'),
		message: I18n.t('Video_escalation_modal_description'),
		confirmationText: I18n.t('Start_video_call'),
		onPress: () => (serverEscalation ? executeEscalation(callId) : switchToConference(roomId!))
	});
}
