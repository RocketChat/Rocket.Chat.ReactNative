import { StyleSheet, View } from 'react-native';
import Animated, { ReduceMotion, useAnimatedStyle, withDelay, withSpring } from 'react-native-reanimated';

import { CustomIcon } from '~/containers/CustomIcon';

const CHEVRON_SIZE = 20;
const CHEVRON_SPRING = { stiffness: 410, damping: 40.5, mass: 1, reduceMotion: ReduceMotion.System };
const INCOMING_DELAY_MS = 28;

const crossfadeTo = (visible: boolean) => {
	'worklet';
	return visible ? withDelay(INCOMING_DELAY_MS, withSpring(1, CHEVRON_SPRING)) : withSpring(0, CHEVRON_SPRING);
};

const SectionChevron = ({ collapsed, color }: { collapsed: boolean; color: string }) => {
	const expandedChevronStyle = useAnimatedStyle(() => ({ opacity: crossfadeTo(!collapsed) }));
	const collapsedChevronStyle = useAnimatedStyle(() => ({ opacity: crossfadeTo(collapsed) }));

	return (
		<View style={chevronStyles.container}>
			<Animated.View style={[StyleSheet.absoluteFill, expandedChevronStyle]}>
				<CustomIcon name='chevron-up' size={CHEVRON_SIZE} color={color} />
			</Animated.View>
			<Animated.View style={[StyleSheet.absoluteFill, collapsedChevronStyle]}>
				<CustomIcon name='chevron-down' size={CHEVRON_SIZE} color={color} />
			</Animated.View>
		</View>
	);
};

const chevronStyles = StyleSheet.create({
	container: {
		width: CHEVRON_SIZE,
		height: CHEVRON_SIZE
	}
});

export default SectionChevron;
