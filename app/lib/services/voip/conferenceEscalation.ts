import type { CallFeature } from '@rocket.chat/media-signaling';

import I18n from '~/i18n';
import { getVoipConferenceEscalationKey } from '~/lib/constants/keys';
import { showErrorAlert } from '~/lib/methods/helpers/info';
import log from '~/lib/methods/helpers/log';
import UserPreferences from '~/lib/methods/userPreferences';
import { videoConfJoin } from '~/lib/methods/videoConf';
import { mediaCallsConference } from '~/lib/services/restApi';
import { store } from '~/lib/store/auxStore';
import { useCallStore } from './useCallStore';

// Missing from media-signaling's CallFeature; servers without it reject it as an unknown feature.
const CONFERENCE_ESCALATION = 'conference-escalation' as CallFeature;

const isConferenceEscalationEnabled = (): boolean => !!store.getState().settings.VoIP_TeamCollab_Video_Escalation_Enabled;

export const getSupportedCallFeatures = (): CallFeature[] =>
	isConferenceEscalationEnabled() ? ['audio', 'hold', CONFERENCE_ESCALATION] : ['audio', 'hold'];

/** Mirrors the setting per server so native accept (CallKit / Android notification) advertises the same features. */
export const watchConferenceEscalation = (): (() => void) => {
	let last: string | null = null;
	const sync = () => {
		const { server } = store.getState().server;
		const enabled = isConferenceEscalationEnabled();
		const current = `${server}:${enabled}`;
		if (!server || current === last) {
			return;
		}
		last = current;
		if (enabled) {
			UserPreferences.setString(getVoipConferenceEscalationKey(server), 'true');
		} else {
			UserPreferences.removeItem(getVoipConferenceEscalationKey(server));
		}
	};
	sync();
	return store.subscribe(sync);
};

export const isEscalatedNotification = (signal: unknown): signal is { callId: string } => {
	const { type, notification } = signal as { type?: string; notification?: string };
	return type === 'notification' && notification === 'escalated';
};

let joining = false;

/** The peer switched the voice call to a conference: leave the voice call and join that conference. */
export const joinEscalatedConference = async (): Promise<void> => {
	const { callId, roomId } = useCallStore.getState();
	if (!callId || joining) {
		return;
	}
	joining = true;
	try {
		const result = await mediaCallsConference(callId);
		if (!result.success) {
			throw new Error('media-calls.conference failed');
		}
		useCallStore.getState().endCall();
		await videoConfJoin(result.conferenceId, false, true, { rid: roomId ?? undefined });
	} catch (error) {
		log(error);
		showErrorAlert(I18n.t('error-init-video-conf'));
	} finally {
		joining = false;
	}
};
