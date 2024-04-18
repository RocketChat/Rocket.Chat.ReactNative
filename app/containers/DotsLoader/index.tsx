import React, { useEffect, useState } from 'react';
import { StyleProp, View, ViewStyle, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useTheme } from '../../theme';

const SIZE = 8;
const MARGIN = 4;
const dots = [1, 2, 3];
const INTERVAL = 300;
const ANIMATION_DURATION = 400;
const ANIMATION_SCALE = 1.4;

function Dot({ active }: { active: boolean }): JSX.Element {
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
		backgroundColor: active ? colors.badgeBackgroundLevel2 : colors.badgeBackgroundLevel1
	};

	return <Animated.View style={[style, animatedStyle]} />;
}

function DotsLoader(): JSX.Element {
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
		<View style={styles.dotsContainer}>
			{dots.map(i => (
				<Dot key={i} active={i === active} />
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	dotsContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginLeft: 6 }
});

export default DotsLoader;
