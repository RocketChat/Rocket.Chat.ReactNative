import { useEffect, useState } from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';
import Animated, { makeMutable, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';

import { useTheme } from '~/theme';

interface IAvatarSkeleton {
	borderRadius: ViewStyle['borderRadius'];
}

const styles = StyleSheet.create({
	skeleton: {
		...StyleSheet.absoluteFill
	}
});

const SKELETON_DELAY = 150;

const pulse = makeMutable(1);
let activeSkeletons = 0;

const startPulse = () => {
	if (activeSkeletons++ === 0) {
		pulse.value = withRepeat(withTiming(0.4, { duration: 800 }), -1, true);
	}
};

const stopPulse = () => {
	if (--activeSkeletons === 0) {
		pulse.value = 1;
	}
};

const SkeletonPulse = ({ borderRadius }: IAvatarSkeleton) => {
	const { colors } = useTheme();

	useEffect(() => {
		startPulse();
		return stopPulse;
	}, []);

	const animatedStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

	return (
		<Animated.View
			pointerEvents='none'
			testID='avatar-skeleton'
			style={[styles.skeleton, { backgroundColor: colors.surfaceSelected, borderRadius }, animatedStyle]}
		/>
	);
};

const AvatarSkeleton = ({ borderRadius }: IAvatarSkeleton) => {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => setVisible(true), SKELETON_DELAY);
		return () => clearTimeout(timer);
	}, []);

	return visible ? <SkeletonPulse borderRadius={borderRadius} /> : null;
};

export default AvatarSkeleton;
