import I18n from '~/i18n';
import { showConfirmationAlert } from '~/lib/methods/helpers/info';
import { isInActiveVoipCall } from './isInActiveVoipCall';
import { useCallStore } from './useCallStore';

/**
 * A VoIP call and a video conference cannot share the microphone, so only one of them runs at a
 * time. Asks the user before trading the ongoing call for the conference.
 *
 * Resolves true when the conference may proceed — including when no VoIP call is active, so
 * callers can gate on it unconditionally.
 */
export function confirmEndVoipCallForVideoConf(): Promise<boolean> {
	if (!isInActiveVoipCall()) {
		return Promise.resolve(true);
	}

	return new Promise(resolve => {
		showConfirmationAlert({
			title: I18n.t('Join_video_conference_question_mark'),
			message: I18n.t('Joining_video_conference_ends_call'),
			confirmationText: I18n.t('End_call_and_join'),
			onPress: () => resolve(true),
			onCancel: () => resolve(false)
		});
	});
}

/** Hangs the VoIP call up so the conference can take the microphone. No-op when none is active. */
export function endVoipCallForVideoConf(): void {
	if (!isInActiveVoipCall()) {
		return;
	}
	useCallStore.getState().endCall();
}
