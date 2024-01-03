import { Audio } from 'expo-av';
import React, { useEffect, useRef } from 'react';

export enum ERingerSounds {
	DIALTONE = 'dialtone',
	RINGTONE = 'ringtone'
}

const Ringer = React.memo(({ ringer }: { ringer: ERingerSounds }) => {
	const sound = useRef(new Audio.Sound());

	useEffect(() => {
		const loadAndPlay = async () => {
			try {
				const soundFile = ringer === ERingerSounds.DIALTONE ? require(`./dialtone.mp3`) : require(`./ringtone.mp3`);
				await sound.current.loadAsync(soundFile);
				await sound.current.playAsync();
				await sound.current.setIsLoopingAsync(true);
			} catch (error) {
				console.error('Error loading sound:', error);
			}
		};

		loadAndPlay();

		return () => {
			sound.current?.unloadAsync();
		};
	}, []);

	return null;
});

export default Ringer;
