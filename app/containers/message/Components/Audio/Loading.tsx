import React, { useEffect } from 'react';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { CustomIcon } from '../../../CustomIcon';
import { useTheme } from '../../../../theme';

const Loading = () => {
	const rotation = useSharedValue(0);
	const { colors } = useTheme();

	useEffect(() => {
		rotation.value = withRepeat(
			withTiming(360, {
				duration: 1000,
				easing: Easing.inOut(Easing.linear)
			}),
			-1
		);
	}, []);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ rotate: `${rotation.value}deg` }]
	}));

	return (
		<Animated.View style={[animatedStyle]}>
			<CustomIcon name={'loading'} size={24} color={colors.buttonText} />
		</Animated.View>
	);
};

export default Loading;
