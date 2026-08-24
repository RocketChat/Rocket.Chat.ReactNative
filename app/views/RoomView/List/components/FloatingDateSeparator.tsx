import { StyleSheet } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import dayjs from '../../../../lib/dayjs';
import { DateSeparatorLabel } from '../../../../containers/DateSeparator';
import { BUBBLE_TOP_MARGIN } from '../constants';

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		top: BUBBLE_TOP_MARGIN,
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
		<Animated.View pointerEvents='none' style={[styles.container, style]}>
			<DateSeparatorLabel date={dayjs(ts).format('LL')} />
		</Animated.View>
	);
};

export default FloatingDateSeparator;
