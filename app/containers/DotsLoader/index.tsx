import React, { useEffect, useState } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useTheme } from '../../theme';

const SIZE = 8;
const MARGIN = 4;
const dots = [1, 2, 3];
const INTERVAL = 300;
const ANIMATION_DURATION = 400;
const ANIMATION_SCALE = 1.4;

interface DotProps {
	active: boolean;
}

const Dot: React.FC<DotProps> = ({ active }) => {
	const scale = useSharedValue(1);

	useEffect(() => {
		scale.value = withTiming(active ? ANIMATION_SCALE : 1, {
			duration: ANIMATION_DURATION
		});
	}, [active]);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }]
	}));

	const { colors } = useTheme();

	const style: StyleProp<ViewStyle> = {
		height: SIZE,
		width: SIZE,
		borderRadius: SIZE / 2,
		marginHorizontal: MARGIN,
		backgroundColor: active ? colors.dotActiveBg : colors.dotBg
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
