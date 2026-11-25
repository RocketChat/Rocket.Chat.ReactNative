import { useEffect, useState } from 'react';
import { useAnimatedStyle, useSharedValue, withDelay, withSpring, type WithSpringConfig } from 'react-native-reanimated';

export interface IMountFade {
	fadesOnMount: () => boolean;
	spring: WithSpringConfig;
}

const FIRST_DRAWN_FRAME_DELAY_MS = 1;

export const useFadeInOnMount = ({ fadesOnMount, spring }: IMountFade) => {
	const [fades] = useState(fadesOnMount);
	const opacity = useSharedValue(fades ? 0 : 1);

	useEffect(() => {
		if (fades) {
			opacity.set(withDelay(FIRST_DRAWN_FRAME_DELAY_MS, withSpring(1, spring)));
		}
	}, [fades, opacity, spring]);

	return useAnimatedStyle(() => ({ opacity: opacity.get() }));
};
