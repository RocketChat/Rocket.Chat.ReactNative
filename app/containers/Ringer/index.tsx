import { Audio } from 'expo-av';
import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';

export enum ERingerSounds {
	DIALTONE = 'dialtone',
	RINGTONE = 'ringtone'
}

const Ringer = React.memo(({ ringer }: { ringer: ERingerSounds }) => {
	console.log('Ringer', ringer);

	const sound = useRef<Audio.Sound | null>(null);
	useEffect(() => {
		(async () => {
			let expo = null;
			switch (ringer) {
				case ERingerSounds.DIALTONE:
					expo = await Audio.Sound.createAsync(require(`./dialtone.mp3`));
					break;
				case ERingerSounds.RINGTONE:
					expo = await Audio.Sound.createAsync(require(`./ringtone.mp3`));
					break;
				default:
					expo = await Audio.Sound.createAsync(require(`./dialtone.mp3`));
					break;
			}
			sound.current = expo.sound;
			await sound.current.playAsync();
			await sound.current.setIsLoopingAsync(true);
		})();
	}, []);

	useEffect(() => () => stopSound(), []);

	const stopSound = () => {
		sound?.current?.unloadAsync();
	};

	return <View />;
});

export default Ringer;
