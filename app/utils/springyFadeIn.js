import { Animated } from 'react-native';

export function springyFadeIn() {
	const transitionSpec = {
		timing: Animated.spring,
		tension: 10,
		useNativeDriver: true
	};

	return {
		transitionSpec,
		screenInterpolator: ({ position, scene }) => {
			const { index } = scene;

			const opacity = position.interpolate({
				inputRange: [index - 1, index],
				outputRange: [0, 1]
			});

			return { opacity };
		}
	};
}
