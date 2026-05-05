import { useAudioPlayer } from 'expo-audio';
import React, { useEffect } from 'react';

export enum ERingerSounds {
	DIALTONE = 'dialtone',
	RINGTONE = 'ringtone'
}

const Ringer = React.memo(({ ringer }: { ringer: ERingerSounds }) => {
	const soundFile = ringer === ERingerSounds.DIALTONE ? require('./dialtone.mp3') : require('./ringtone.mp3');
	const player = useAudioPlayer(soundFile);

	useEffect(() => {
		try {
			player.loop = true;
			player.play();
		} catch (error) {
			console.error('Error loading sound:', error);
		}
	}, [player]);

	return null;
});

export default Ringer;
