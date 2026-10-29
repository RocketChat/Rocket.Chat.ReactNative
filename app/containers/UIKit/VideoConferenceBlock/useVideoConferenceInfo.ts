import { useEffect } from 'react';

import { useEndpointData } from '~/lib/hooks/useEndpointData';
import { emitter } from '~/lib/methods/helpers/emitter';

export const useVideoConferenceInfo = (callId: string) => {
	const { result, error, reload } = useEndpointData('video-conference.info', { callId });

	useEffect(() => {
		const onUpdate = (updatedCallId: string) => {
			if (updatedCallId === callId) {
				reload();
			}
		};
		emitter.on('videoConfUpdated', onUpdate);
		return () => emitter.off('videoConfUpdated', onUpdate);
	}, [callId, reload]);

	const participants = result?.success ? result.users.filter(user => user.joined !== false) : [];

	return { result, error, participants };
};
