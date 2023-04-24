import React, { useEffect, useState } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const SIZE = 7;
const MARGIN = 5;
const BG = '#a9cbff';
const ACTIVE_BG = '#1d74f5';
const dots = [1, 2, 3];
const INTERVAL = 300;
const ANIMATION_DURATION = 400;
const ANIMATION_SCALE = 1.4;

interface DotProps {
	size?: number;
	background?: string;
	activeBackground?: string;
	dotMargin?: number;
	animationDuration?: number;
	animationScale?: number;
	active: boolean;
}

const Dot: React.FC<DotProps> = ({
	active,
	size = SIZE,
	background = BG,
	activeBackground = ACTIVE_BG,
	dotMargin = MARGIN,
	animationDuration = ANIMATION_DURATION,
	animationScale = ANIMATION_SCALE
}) => {
	const scale = useSharedValue(1);

	useEffect(() => {
		scale.value = withTiming(active ? animationScale : 1, {
			duration: animationDuration
		});
	}, [active]);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }]
	}));

	const style: StyleProp<ViewStyle> = {
		height: size,
		width: size,
		borderRadius: size / 2,
		marginHorizontal: dotMargin,
		backgroundColor: active ? activeBackground : background
	};

	return <Animated.View style={[style, animatedStyle]} />;
};

const DotsLoader: React.FC = () => {
	const [active, setActive] = useState(1);

	useEffect(() => {
		const interval = setInterval(() => {
			setActive(prevActive => (prevActive > 2 ? 1 : prevActive + 1));
		}, INTERVAL);
		return () => {
			clearInterval(interval);
		};
	}, []);

	return (
		<View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
			{dots.map(i => (
				<Dot key={i} active={i === active} />
			))}
		</View>
	);
};

export default DotsLoader;
