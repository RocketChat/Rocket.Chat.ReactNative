import { Easing, Animated } from 'react-native';
import { TransitionPresets, HeaderStyleInterpolators } from '@react-navigation/stack';

import { isAndroid } from '../deviceInfo';
import conditional from './conditional';

const { multiply } = Animated;

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

const FadeIn = {
	animation: 'timing',
	config: {
		duration: 250,
		easing: Easing.out(Easing.poly(5))
	}
};

const FadeOut = {
	animation: 'timing',
	config: {
		duration: 150,
		easing: Easing.in(Easing.poly(5))
	}
};

export const FadeFromCenterModal = {
	gestureDirection: 'vertical',
	transitionSpec: {
		open: FadeIn,
		close: FadeOut
	},
	cardStyleInterpolator: forFadeFromCenter
};

const forStackAndroid = ({
	current,
	inverted,
	layouts: { screen }
}) => {
	const translateX = multiply(
		current.progress.interpolate({
			inputRange: [0, 1],
			outputRange: [screen.width, 0]
		}),
		inverted
	);

	const opacity = current.progress.interpolate({
		inputRange: [0, 1],
		outputRange: [0, 1]
	});

	return {
		cardStyle: {
			opacity,
			transform: [{ translateX }]
		}
	};
};

const StackAndroid = {
	gestureDirection: 'horizontal',
	transitionSpec: {
		open: FadeIn,
		close: FadeOut
	},
	cardStyleInterpolator: forStackAndroid,
	headerStyleInterpolator: HeaderStyleInterpolators.forFade
};

export const StackAnimation = isAndroid ? StackAndroid : TransitionPresets.SlideFromRightIOS;
export const ModalAnimation = TransitionPresets.ModalTransition;
