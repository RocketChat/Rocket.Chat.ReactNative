import { useAudioPlayer } from 'expo-audio';
import { useEffect, memo } from 'react';

import log from '../../lib/methods/helpers/log';

export enum ERingerSounds {
	DIALTONE = 'dialtone',
	RINGTONE = 'ringtone'
}

const RINGER_SOUND_FILES = {
	[ERingerSounds.DIALTONE]: require('./dialtone.mp3'),
	[ERingerSounds.RINGTONE]: require('./ringtone.mp3')
} as const;

const Ringer = memo(({ ringer }: { ringer: ERingerSounds }) => {
	const player = useAudioPlayer(RINGER_SOUND_FILES[ringer]);

	useEffect(() => {
		try {
			player.loop = true;
			player.play();
		} catch (error) {
			log(error);
		}

		return () => {
			try {
				player.pause();
				player.release();
			} catch (error) {
				log(error);
			}
		};
	}, [player]);

	return null;
});

export default Ringer;
