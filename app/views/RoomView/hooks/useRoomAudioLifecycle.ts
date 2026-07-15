import { useEffect } from 'react';

import AudioManager from '../../../lib/methods/AudioManager';
import { type IRoomViewProps } from '../definitions';

export function useRoomAudioLifecycle(
	rid: string | undefined,
	tmid: string | undefined,
	navigation: IRoomViewProps['navigation']
): void {
	'use memo';

	useEffect(() => {
		const unsubscribeBlur = navigation.addListener('blur', () => AudioManager.pauseAudio());
		return unsubscribeBlur;
	}, [navigation]);

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
