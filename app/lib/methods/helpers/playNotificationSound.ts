import { Audio } from 'expo-av';

const RINGTONE_SOUND = require('../../../containers/Ringer/ringtone.mp3');
const CALL_ENDED_SOUND = require('../../../containers/Ringer/call-ended.mp3');

const sounds: Record<string, any> = {
	0: CALL_ENDED_SOUND,
	default: CALL_ENDED_SOUND,
	beep: RINGTONE_SOUND,
	ding: CALL_ENDED_SOUND,
	chelle: RINGTONE_SOUND,
	droplet: CALL_ENDED_SOUND,
	highbell: RINGTONE_SOUND,
	seasons: RINGTONE_SOUND
};

const DEFAULT_SOUND = CALL_ENDED_SOUND;

const WATCHDOG_MS = 5000;

const normalizeSoundName = (soundName: string) => soundName.trim().split(' ')[0].toLowerCase();

export const playNotificationSound = async (soundName: string): Promise<void> => {
	if (!soundName) {
		return;
	}

	const normalized = normalizeSoundName(soundName);

	if (!normalized || normalized === 'none') {
		return;
	}

	let sound: Audio.Sound | undefined;
	let unloaded = false;
	let watchdog: ReturnType<typeof setTimeout> | null = null;

	const unload = () => {
		if (unloaded || !sound) {
			return;
		}
		unloaded = true;
		if (watchdog) {
			clearTimeout(watchdog);
			watchdog = null;
		}
		sound.unloadAsync().catch(() => {
			// best-effort unload
		});
	};

	try {
		const asset = sounds[normalized] || DEFAULT_SOUND;
		({ sound } = await Audio.Sound.createAsync(asset));

		sound.setOnPlaybackStatusUpdate(status => {
			if (status.isLoaded && status.didJustFinish) {
				unload();
			}
		});

		await sound.playAsync();

		watchdog = setTimeout(unload, WATCHDOG_MS);
	} catch {
		unload();
		// best-effort notification sound
	}
};
