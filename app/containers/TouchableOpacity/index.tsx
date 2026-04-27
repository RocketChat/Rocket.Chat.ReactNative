import React from 'react';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface TouchableOpacityProps extends PressableProps {
	style?: StyleProp<ViewStyle>;
	opacity?: number;
	activeOpacity?: number;
}

function TouchableOpacity(props: TouchableOpacityProps): React.JSX.Element {
	const opacity = useSharedValue(props.opacity || 1);
	const animatedStyle = useAnimatedStyle(() => ({
		opacity: opacity.value
	}));

	const onPressIn = () => {
		opacity.value = props.activeOpacity || 0.2;
	};
	const onPressOut = () => {
		opacity.value = props.opacity || 1;
	};

	return (
		<AnimatedPressable {...props} onPressIn={onPressIn} onPressOut={onPressOut} style={[animatedStyle, props.style]}>
			{props.children}
		</AnimatedPressable>
	);
}

export default TouchableOpacity;
