import { createAudioPlayer } from 'expo-audio';
import { useEffect, memo } from 'react';

export enum ERingerSounds {
	DIALTONE = 'dialtone',
	RINGTONE = 'ringtone'
}

const Ringer = memo(({ ringer }: { ringer: ERingerSounds }) => {
	useEffect(() => {
		const soundFile = ringer === ERingerSounds.DIALTONE ? require('./dialtone.mp3') : require('./ringtone.mp3');
		const player = createAudioPlayer(soundFile);
		try {
			player.loop = true;
			player.play();
		} catch (error) {
			console.error('Error playing sound:', error);
		}

		return () => {
			try {
				player.pause();
				player.release();
			} catch (error) {
				console.error('Error loading sound:', error);
			}
		};
	}, []);

	return null;
});

export default Ringer;
