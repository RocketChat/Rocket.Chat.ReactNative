import I18n from '~/i18n';
import { showErrorAlert } from '~/lib/methods/helpers/info';
import log from '~/lib/methods/helpers/log';
import { videoConfJoin } from '~/lib/methods/videoConf';
import { mediaCallsConference } from '~/lib/services/restApi';
import { useCallStore } from './useCallStore';

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
