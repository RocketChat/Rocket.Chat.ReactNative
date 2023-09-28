import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
	interpolate,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withRepeat,
	withTiming
} from 'react-native-reanimated';

export const AnimatedRinger = ({ delay }: { delay: number }) => {
	const ring = useSharedValue(0);

	const ringStyle = useAnimatedStyle(() => ({
		opacity: 0.8 - ring.value,
		transform: [
			{
				scale: interpolate(ring.value, [0, 1], [0, 4])
			}
		]
	}));

	useEffect(() => {
		ring.value = withDelay(
			delay,
			withRepeat(
				withTiming(1, {
					duration: 3000
				}),
				-1,
				false
			)
		);
	}, []);

	return <Animated.View style={[styles.ring, ringStyle]} />;
};

export const styles = StyleSheet.create({
	ring: {
		position: 'absolute',
		width: 80,
		height: 80,
		borderRadius: 40,
		borderColor: '#FFF',
		borderWidth: 10
	}
});
