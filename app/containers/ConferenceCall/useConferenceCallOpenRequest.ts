import { useEffect } from 'react';
import { AppState } from 'react-native';

import log from '~/lib/methods/helpers/log';
import { expandConferenceCall } from '~/lib/services/conference/conferenceCallNavigation';
import {
	consumeConferenceCallOpenRequest,
	onConferenceCallOpenRequested
} from '~/lib/services/conference/conferenceCallOpenRequest';

export const useConferenceCallOpenRequest = (): void => {
	useEffect(() => {
		const openIfRequested = () => {
			consumeConferenceCallOpenRequest()
				.then(requested => {
					if (requested) {
						expandConferenceCall();
					}
				})
				.catch(log);
		};
		openIfRequested();
		const requests = onConferenceCallOpenRequested(openIfRequested);
		const appState = AppState.addEventListener('change', state => {
			if (state === 'active') {
				openIfRequested();
			}
		});
		return () => {
			requests.remove();
			appState.remove();
		};
	}, []);
};
