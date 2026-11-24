import { useState } from 'react';
import { type SharedValue, useAnimatedReaction } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

export interface IShownTime {
	time: number;
	duration: number;
}

export const useShownTime = (progress: SharedValue<number>, duration: SharedValue<number>) => {
	const [shownTime, setShownTime] = useState<IShownTime>({ time: 0, duration: 0 });

	const showTime = (time: number, total: number) => setShownTime({ time: Math.floor(time), duration: Math.floor(total) });

	useAnimatedReaction(
		() => ({ time: Math.floor(progress.get() * duration.get()), total: Math.floor(duration.get()) }),
		(current, previous) => {
			if (current.time !== previous?.time || current.total !== previous?.total) {
				scheduleOnRN(showTime, current.time, current.total);
			}
		}
	);

	return { shownTime, showTime };
};
