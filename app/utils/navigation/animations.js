import { Easing } from 'react-native';
import { TransitionPresets } from '@react-navigation/stack';

import { isAndroid } from '../deviceInfo';
import conditional from './conditional';

export const StackAnimation = isAndroid ? TransitionPresets.FadeFromBottomAndroid : TransitionPresets.SlideFromRightIOS;
export const ModalAnimation = TransitionPresets.ModalTransition;

const forFadeFromCenter = ({
	current,
	closing
}) => {
	const opacity = conditional(
		closing,
		current.progress,
		current.progress.interpolate({
			inputRange: [0, 0.5, 0.9, 1],
			outputRange: [0, 0.25, 0.7, 1]
		})
	);

	return {
		cardStyle: {
			opacity
		}
	};
};

const FadeInFromCenterSpec = {
	animation: 'timing',
	config: {
		duration: 350,
		easing: Easing.out(Easing.poly(5))
	}
};

const FadeOutToCenterSpec = {
	animation: 'timing',
	config: {
		duration: 150,
		easing: Easing.in(Easing.linear)
	}
};

export const FadeFromCenterModal = {
	gestureDirection: 'vertical',
	transitionSpec: {
		open: FadeInFromCenterSpec,
		close: FadeOutToCenterSpec
	},
	cardStyleInterpolator: forFadeFromCenter
};
