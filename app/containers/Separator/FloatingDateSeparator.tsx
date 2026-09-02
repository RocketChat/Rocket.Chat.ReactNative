import { StyleSheet } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { DateSeparatorLabel } from './DateSeparator';

const TOP_MARGIN = 8;

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		top: TOP_MARGIN,
		left: 0,
		right: 0,
		alignItems: 'center'
	}
});

const FloatingDateSeparator = ({ ts, opacity }: { ts?: Date | string | null; opacity: SharedValue<number> }) => {
	const style = useAnimatedStyle(() => ({ opacity: opacity.get() }));

	if (!ts) {
		return null;
	}

	return (
		<Animated.View
			pointerEvents='none'
			accessibilityElementsHidden
			importantForAccessibility='no-hide-descendants'
			style={[styles.container, style]}>
			<DateSeparatorLabel ts={ts} />
		</Animated.View>
	);
};

export default FloatingDateSeparator;
