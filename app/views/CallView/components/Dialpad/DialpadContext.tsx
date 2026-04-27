import React, { createContext, useContext, useEffect, useRef } from 'react';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';

const DTMF_ASSETS: Record<string, ReturnType<typeof require>> = {
	'0': require('../../../../containers/Ringer/dtmf/digit-0.mp3'),
	'1': require('../../../../containers/Ringer/dtmf/digit-1.mp3'),
	'2': require('../../../../containers/Ringer/dtmf/digit-2.mp3'),
	'3': require('../../../../containers/Ringer/dtmf/digit-3.mp3'),
	'4': require('../../../../containers/Ringer/dtmf/digit-4.mp3'),
	'5': require('../../../../containers/Ringer/dtmf/digit-5.mp3'),
	'6': require('../../../../containers/Ringer/dtmf/digit-6.mp3'),
	'7': require('../../../../containers/Ringer/dtmf/digit-7.mp3'),
	'8': require('../../../../containers/Ringer/dtmf/digit-8.mp3'),
	'9': require('../../../../containers/Ringer/dtmf/digit-9.mp3'),
	'*': require('../../../../containers/Ringer/dtmf/digit-star.mp3'),
	'#': require('../../../../containers/Ringer/dtmf/digit-pound.mp3')
};

interface DialpadContextValue {
	playTone: (digit: string) => void;
	stopTone: (digit: string) => void;
}

const DialpadContext = createContext<DialpadContextValue>({ playTone: () => {}, stopTone: () => {} });

export const DialpadProvider = ({ children }: { children: React.ReactNode }) => {
	const soundsRef = useRef<Record<string, Audio.Sound>>({});
	const playingRef = useRef<Record<string, Promise<void> | undefined>>({});

	useEffect(() => {
		let cancelled = false;
		const loadAll = async () => {
			try {
				await Audio.setAudioModeAsync({
					allowsRecordingIOS: true,
					playsInSilentModeIOS: true,
					playThroughEarpieceAndroid: true,
					interruptionModeIOS: InterruptionModeIOS.DoNotMix,
					interruptionModeAndroid: InterruptionModeAndroid.DoNotMix
				});
			} catch (error) {
				console.warn('[DialpadContext] Failed to set audio mode:', error);
			}
			await Promise.all(
				Object.entries(DTMF_ASSETS).map(async ([digit, asset]) => {
					try {
						const sound = new Audio.Sound();
						await sound.loadAsync(asset);
						await sound.setIsLoopingAsync(true);
						if (cancelled) {
							await sound.unloadAsync();
							return;
						}
						soundsRef.current[digit] = sound;
					} catch (error) {
						console.warn(`[DialpadContext] Failed to load DTMF sound for "${digit}":`, error);
					}
				})
			);
		};
		loadAll();

		return () => {
			cancelled = true;
			Object.values(soundsRef.current).forEach(s => s.unloadAsync().catch(() => {}));
			soundsRef.current = {};
			playingRef.current = {};
		};
	}, []);

	const playTone = async (digit: string) => {
		const sound = soundsRef.current[digit];
		if (!sound) {
			return;
		}
		const start = (async () => {
			try {
				await sound.setPositionAsync(0);
				await sound.playAsync();
			} catch (error) {
				console.warn(`[DialpadContext] Failed to play DTMF tone for "${digit}":`, error);
			}
		})();
		playingRef.current[digit] = start;
		await start;
	};

	const stopTone = async (digit: string) => {
		const sound = soundsRef.current[digit];
		if (!sound) {
			return;
		}
		await playingRef.current[digit];
		playingRef.current[digit] = undefined;
		try {
			await sound.stopAsync();
		} catch (error) {
			// Silently ignore stop errors (e.g., sound not currently playing)
		}
	};

	return <DialpadContext.Provider value={{ playTone, stopTone }}>{children}</DialpadContext.Provider>;
};

export const useDialpadAudio = () => useContext(DialpadContext);
