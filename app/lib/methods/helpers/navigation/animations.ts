import { Animated, Easing } from 'react-native';
import { HeaderStyleInterpolators, TransitionPreset, TransitionPresets } from '@react-navigation/stack';
// eslint-disable-next-line import/no-unresolved
import { StackCardStyleInterpolator, TransitionSpec } from '@react-navigation/stack/lib/typescript/src/types';

import { isAndroid } from '../deviceInfo';
import conditional from './conditional';

const { multiply } = Animated;

const forFadeFromCenter: StackCardStyleInterpolator = ({ current, closing }) => {
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

const FadeIn: TransitionSpec = {
	animation: 'timing',
	config: {
		duration: 250,
		easing: Easing.out(Easing.poly(5))
	}
};

const FadeOut: TransitionSpec = {
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

const forStackAndroid: StackCardStyleInterpolator = ({ current, inverted, layouts: { screen } }) => {
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

const StackAndroid: TransitionPreset = {
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
