import { Audio } from 'expo-av';

import log from './log';

const sounds: Record<string, any> = {
	'beep Beep': require('../../containers/Ringer/call-ended.mp3'),
	'ding Ding': require('../../containers/Ringer/call-ended.mp3'),
	'chelle Chelle': require('../../containers/Ringer/call-ended.mp3'),
	'droplet Droplet': require('../../containers/Ringer/call-ended.mp3'),
	'highbell Highbell': require('../../containers/Ringer/call-ended.mp3'),
	'seasons Seasons': require('../../containers/Ringer/call-ended.mp3')
};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const DEFAULT_SOUND = require('../../containers/Ringer/call-ended.mp3');

// Watchdog prevents memory leaks if didJustFinish never fires (rare OS preemption).
const WATCHDOG_MS = 5000;

export const playNotificationSound = async (soundName: string): Promise<void> => {
	if (!soundName || soundName === 'none' || soundName === 'none None') {
		return;
	}

	try {
		const asset = sounds[soundName] || DEFAULT_SOUND;
		const { sound } = await Audio.Sound.createAsync(asset);

		let watchdog: ReturnType<typeof setTimeout> | null = null;

		const cleanup = () => {
			if (watchdog) {
				clearTimeout(watchdog);
				watchdog = null;
			}
		};

		sound.setOnPlaybackStatusUpdate(status => {
			if (status.isLoaded && status.didJustFinish) {
				cleanup();
				sound.unloadAsync().catch(() => {
					// best-effort unload
				});
			}
		});

		await sound.playAsync();

		// Watchdog releases sound if didJustFinish never fires (e.g., OS interruption).
		watchdog = setTimeout(() => {
			cleanup();
			sound.unloadAsync().catch(() => {
				// best-effort unload
			});
		}, WATCHDOG_MS);
	} catch (error) {
		log(error);
	}
};
