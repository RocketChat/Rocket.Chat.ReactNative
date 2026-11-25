import { useEffect, useRef } from 'react';
import { useDerivedValue, useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';
import type { AudioStatus } from 'expo-audio';

import {
	advanceFrame,
	applyStatus,
	createPlaybackClock,
	type IPlaybackClock,
	type IPlaybackClockStatus,
	pause as pauseClock,
	seek as seekClock,
	setRate as setClockRate,
	settleSeek
} from '../playbackClock';

export const usePlaybackClock = (rate: number) => {
	const clock = useSharedValue<IPlaybackClock>(createPlaybackClock(rate));
	const position = useDerivedValue(() => clock.get().shown);
	const duration = useSharedValue(0);
	const seekGeneration = useRef(0);

	const frameCallback = useFrameCallback(({ timeSincePreviousFrame }) => {
		clock.set(advanceFrame(clock.get(), (timeSincePreviousFrame ?? 0) / 1000, duration.get()));
	}, false);
	const setFrameCallbackActive = frameCallback.setActive;

	const commit = (next: IPlaybackClock) => {
		'worklet';

		const wasPlaying = clock.get().playing;
		clock.set(next);
		if (next.playing !== wasPlaying) {
			scheduleOnRN(setFrameCallbackActive, next.playing);
		}
	};

	const onStatus = (status: AudioStatus) => {
		if (!status.isLoaded) {
			return;
		}
		const knownDuration = Math.max(status.duration || 0, 0);
		duration.set(knownDuration);
		const currentTime = status.currentTime || 0;
		const clockStatus: IPlaybackClockStatus = {
			currentTime: knownDuration > 0 ? Math.min(currentTime, knownDuration) : currentTime,
			playing: status.playing,
			didJustFinish: status.didJustFinish
		};
		scheduleOnUI(() => {
			'worklet';

			commit(applyStatus(clock.get(), clockStatus));
		});
	};

	const pause = () => {
		scheduleOnUI(() => {
			'worklet';

			commit(pauseClock(clock.get()));
		});
	};

	const seek = async (seconds: number, applySeek: (seconds: number) => Promise<void>) => {
		seekGeneration.current += 1;
		const generation = seekGeneration.current;
		scheduleOnUI(() => {
			'worklet';

			commit(seekClock(clock.get(), seconds, generation));
		});
		await applySeek(seconds);
		scheduleOnUI(() => {
			'worklet';

			commit(settleSeek(clock.get(), generation));
		});
	};

	useEffect(() => {
		scheduleOnUI(() => {
			'worklet';

			clock.set(setClockRate(clock.get(), rate));
		});
	}, [clock, rate]);

	return { position, duration, onStatus, pause, seek };
};
