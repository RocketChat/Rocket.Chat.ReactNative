import { useEffect } from 'react';

import AudioManager from '~/lib/methods/AudioManager';

export function useRoomAudioLifecycle(rid: string | undefined, tmid: string | undefined): void {
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
