import { createAudioPlayer } from 'expo-audio';
import React, { useEffect, useRef } from 'react';

export enum ERingerSounds {
	DIALTONE = 'dialtone',
	RINGTONE = 'ringtone'
}

const Ringer = React.memo(({ ringer }: { ringer: ERingerSounds }) => {
	const player = useRef(createAudioPlayer());

	useEffect(() => {
		const loadAndPlay = () => {
			try {
				const soundFile = ringer === ERingerSounds.DIALTONE ? require(`./dialtone.mp3`) : require(`./ringtone.mp3`);
				player.current.replace(soundFile);
				player.current.loop = true;
				player.current.play();
			} catch (error) {
				console.error('Error loading sound:', error);
			}
		};

		loadAndPlay();

		return () => {
			player.current?.release();
		};
	}, []);

	return null;
});

export default Ringer;
