import { useEffect, useRef } from 'react';

import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { closeConferenceCall } from '~/lib/services/conference/conferenceCallNavigation';
import { useConferenceCallStore } from '~/lib/services/conference/useConferenceCallStore';
import { useConferenceCallOpenRequest } from './useConferenceCallOpenRequest';

const ConferenceCallGuard = (): null => {
	useConferenceCallOpenRequest();
	const callId = useConferenceCallStore(state => state.callId);
	const owner = useConferenceCallStore(state => state.server);
	const server = useAppSelector(state => state.server.server);
	const callServer = useRef(server);

	useEffect(() => {
		if (callId && (owner ?? callServer.current) !== server) {
			closeConferenceCall();
		}
		callServer.current = server;
	}, [server, callId, owner]);

	return null;
};

export default ConferenceCallGuard;
