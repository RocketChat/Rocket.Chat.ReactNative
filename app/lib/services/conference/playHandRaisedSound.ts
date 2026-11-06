import { type AudioPlayer, createAudioPlayer } from 'expo-audio';

import log from '~/lib/methods/helpers/log';

let player: AudioPlayer | undefined;

export const playHandRaisedSound = (): void => {
	try {
		player ??= createAudioPlayer(require('./sounds/hand-raised.wav'), { keepAudioSessionActive: true });
		player.seekTo(0).catch(log);
		player.play();
	} catch (error) {
		log(error);
	}
};

export const releaseHandRaisedSound = (): void => {
	player?.release();
	player = undefined;
};
