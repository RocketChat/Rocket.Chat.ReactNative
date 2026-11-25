import { useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import AudioManager from '~/lib/methods/AudioManager';
import { blurRoom, focusRoom } from '~/lib/methods/useFocusedRoomStore';

export function useRoomAudioLifecycle(rid: string | undefined, tmid: string | undefined): void {
	useFocusEffect(
		useCallback(() => {
			if (!rid) {
				return;
			}
			const screen = { rid, tmid };
			focusRoom(screen);
			return () => blurRoom(screen);
		}, [rid, tmid])
	);

	useEffect(
		() => () => {
			// Audio keys are rid-scoped; a thread shares its parent's rid, so unloading here would wipe
			// the parent screen's audio. Only the parent screen (no tmid) owns the unload.
			if (!tmid) {
				AudioManager.unloadRoomAudios(rid);
			}
		},
		[rid, tmid]
	);
}
