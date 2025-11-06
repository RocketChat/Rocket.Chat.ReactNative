import React from 'react';
import { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Pressable, type PressableProps } from 'react-native-gesture-handler';
import type { StyleProp, ViewStyle } from 'react-native';

interface TouchableOpacityProps extends PressableProps {
	style?: StyleProp<ViewStyle>;
	activeOpacity?: number;
}

function TouchableOpacity(props: TouchableOpacityProps): React.JSX.Element {
	const opacity = useSharedValue(props.activeOpacity || 1);
	const animatedStyle = useAnimatedStyle(() => ({
		opacity: opacity.value
	}));

	const onPressIn = () => {
		opacity.value = withTiming(0.2);
	};
	const onPressOut = () => {
		opacity.value = withTiming(props.activeOpacity || 1);
	};

	return (
		<Pressable {...props} onPressIn={onPressIn} onPressOut={onPressOut} style={[animatedStyle, props.style]}>
			{props.children}
		</Pressable>
	);
}

export default TouchableOpacity;
