import { StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { type EntryExitAnimationFunction } from 'react-native-reanimated';

import { useTheme } from '~/theme';

interface ISectionRevealFooter {
	revealKey: number;
	entering?: EntryExitAnimationFunction;
	exiting: EntryExitAnimationFunction;
}

const SectionRevealFooter = ({ revealKey, entering, exiting }: ISectionRevealFooter) => {
	const { colors } = useTheme();
	const { height } = useWindowDimensions();

	return (
		<Animated.View
			key={revealKey}
			entering={entering}
			exiting={exiting}
			style={[styles.cover, { height, backgroundColor: colors.surfaceTint }]}
		/>
	);
};

const styles = StyleSheet.create({
	cover: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0
	}
});

export default SectionRevealFooter;
