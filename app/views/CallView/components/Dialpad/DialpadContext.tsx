import { createContext, type ReactNode, useContext, useEffect, useRef } from 'react';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

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
}

const DialpadContext = createContext<DialpadContextValue>({ playTone: () => {} });

export const DialpadProvider = ({ children }: { children: ReactNode }) => {
	const soundsRef = useRef<Record<string, ReturnType<typeof createAudioPlayer>>>({});

	useEffect(() => {
		let cancelled = false;
		const loadAll = async () => {
			try {
				await setAudioModeAsync({
					allowsRecording: true,
					playsInSilentMode: true,
					shouldRouteThroughEarpiece: true,
					interruptionMode: 'doNotMix',
					interruptionModeAndroid: 'doNotMix'
				});
			} catch (error) {
				console.warn('[DialpadContext] Failed to set audio mode:', error);
			}
			await Promise.all(
				Object.keys(DTMF_ASSETS).map(digit => {
					const asset = DTMF_ASSETS[digit];
					try {
						const player = createAudioPlayer(asset);
						if (cancelled) {
							player.release();
							return null;
						}
						soundsRef.current[digit] = player;
					} catch (error) {
						console.warn(`[DialpadContext] Failed to load DTMF sound for "${digit}":`, error);
					}
					return null;
				})
			);
		};
		loadAll();

		return () => {
			cancelled = true;
			Object.values(soundsRef.current).forEach(p => p.release());
			soundsRef.current = {};
		};
	}, []);

	const playTone = async (digit: string) => {
		const player = soundsRef.current[digit];
		if (!player) {
			return;
		}
		try {
			await player.seekTo(0);
			player.play();
		} catch (error) {
			console.warn(`[DialpadContext] Failed to play DTMF tone for "${digit}":`, error);
		}
	};

	return <DialpadContext.Provider value={{ playTone }}>{children}</DialpadContext.Provider>;
};

export const useDialpadAudio = () => useContext(DialpadContext);
