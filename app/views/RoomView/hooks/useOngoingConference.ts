import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { VideoConferenceStatus } from '~/definitions/IVideoConference';
import { emitter } from '~/lib/methods/helpers/emitter';
import sdk from '~/lib/services/sdk';

// The server lists conferences started in the room and those whose discussion is the room, newest first.
export const useOngoingConference = (rid: string): string | undefined => {
	const [callId, setCallId] = useState<string>();

	const refresh = useCallback(async () => {
		try {
			const result = await sdk.get('video-conference.list', { roomId: rid, count: 10 });
			if (result.success) {
				const ongoing = result.data.find(
					call =>
						(call.rid === rid || call.discussionRid === rid) && call.status === VideoConferenceStatus.STARTED && !call.endedAt
				);
				setCallId(ongoing?._id);
			}
		} catch {
			// Keep the last known state; the next focus or videoconf event retries.
		}
	}, [rid]);

	useFocusEffect(
		useCallback(() => {
			refresh();
		}, [refresh])
	);

	useEffect(() => {
		emitter.on('videoConfUpdated', refresh);
		return () => emitter.off('videoConfUpdated', refresh);
	}, [refresh]);

	return callId;
};
