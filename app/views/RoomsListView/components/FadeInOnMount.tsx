import { type ReactNode } from 'react';
import Animated, { type EntryExitAnimationFunction } from 'react-native-reanimated';

import { type IMountFade, useFadeInOnMount } from '../hooks/useFadeInOnMount';

interface IFadeInOnMount {
	fadeIn: IMountFade;
	exiting: EntryExitAnimationFunction;
	children: ReactNode;
}

const FadeInOnMount = ({ fadeIn, exiting, children }: IFadeInOnMount) => {
	const style = useFadeInOnMount(fadeIn);

	return (
		<Animated.View style={style} exiting={exiting}>
			{children}
		</Animated.View>
	);
};

export default FadeInOnMount;
