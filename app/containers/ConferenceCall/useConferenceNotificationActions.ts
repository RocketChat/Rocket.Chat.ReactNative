import { useEffect } from 'react';

import log from '~/lib/methods/helpers/log';
import { conferenceSession } from '~/lib/services/conference/ConferenceSession';
import { closeConferenceCall } from '~/lib/services/conference/conferenceCallNavigation';
import { onConferenceNotificationAction } from '~/lib/services/conference/conferenceForegroundService';

export const useConferenceNotificationActions = (): void => {
	useEffect(() => {
		const actions = onConferenceNotificationAction(action => {
			if (action === 'toggleMic') {
				conferenceSession.toggleMicrophone().catch(log);
			} else if (action === 'leave') {
				closeConferenceCall();
			}
		});
		return () => actions.remove();
	}, []);
};
