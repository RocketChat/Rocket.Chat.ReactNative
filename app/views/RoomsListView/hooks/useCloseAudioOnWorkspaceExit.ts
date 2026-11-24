import { useEffect } from 'react';

import AudioManager from '~/lib/methods/AudioManager';
import { useAppSelector } from '~/lib/hooks/useAppSelector';

export const useCloseAudioOnWorkspaceExit = () => {
	const server = useAppSelector(state => state.server.server);

	useEffect(
		() => () => {
			AudioManager.closeAudio();
		},
		[server]
	);
};
