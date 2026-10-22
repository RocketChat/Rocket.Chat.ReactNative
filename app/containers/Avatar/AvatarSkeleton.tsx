import { useEffect, useState } from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';
import Animated, { makeMutable, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { useTheme } from '~/theme';

interface IAvatarSkeleton {
	borderRadius: ViewStyle['borderRadius'];
}

const SKELETON_DELAY = 150;
const FADE_IN_DURATION = 300;
const PULSE_MIN_OPACITY = 0;
const PULSE_MAX_OPACITY = 1;
const PULSE_DURATION = 800;

const pulse = makeMutable(PULSE_MAX_OPACITY);
let activeSkeletons = 0;

const startPulse = () => {
	activeSkeletons += 1;
	if (activeSkeletons === 1) {
		pulse.set(withRepeat(withTiming(PULSE_MIN_OPACITY, { duration: PULSE_DURATION }), -1, true));
	}
};

const stopPulse = () => {
	activeSkeletons -= 1;
	if (activeSkeletons === 0) {
		pulse.set(PULSE_MAX_OPACITY);
	}
};

const SkeletonPulse = ({ borderRadius }: IAvatarSkeleton) => {
	const { colors } = useTheme();
	const fadeIn = useSharedValue(0);

	useEffect(() => {
		startPulse();
		fadeIn.set(withTiming(1, { duration: FADE_IN_DURATION }));
		return stopPulse;
	}, [fadeIn]);

	const animatedStyle = useAnimatedStyle(() => ({ opacity: pulse.value * fadeIn.value }));

	return (
		<Animated.View
			pointerEvents='none'
			testID='avatar-skeleton'
			style={[StyleSheet.absoluteFill, { backgroundColor: colors.surfaceSelected, borderRadius }, animatedStyle]}
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
