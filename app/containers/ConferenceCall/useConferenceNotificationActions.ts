import { useEffect } from 'react';

import log from '~/lib/methods/helpers/log';
import { conferenceSession } from '~/lib/services/conference/ConferenceSession';
import { closeConferenceCall } from '~/lib/services/conference/conferenceCallNavigation';
import { onConferenceCallNotificationAction } from '~/lib/services/conference/conferenceCallNotification';

export const useConferenceNotificationActions = (): void => {
	useEffect(() => {
		const actions = onConferenceCallNotificationAction(action => {
			if (action === 'mute') {
				conferenceSession.setMicrophone(false).catch(log);
			} else if (action === 'unmute') {
				conferenceSession.setMicrophone(true).catch(log);
			} else if (action === 'leave') {
				closeConferenceCall();
			}
		});
		return () => actions.remove();
	}, []);
};
