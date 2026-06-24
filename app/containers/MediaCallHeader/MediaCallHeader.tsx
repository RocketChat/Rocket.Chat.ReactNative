import { View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useShallow } from 'zustand/react/shallow';
import { StyleSheet } from 'react-native-unistyles';
import { useAnimatedTheme } from 'react-native-unistyles/reanimated';

import { useTheme } from '../../theme';
import Collapse from './components/Collapse';
import EndCall from './components/EndCall';
import { useCallStore, useControlsVisible } from '../../lib/services/voip/useCallStore';
import { Content } from './components/Content';
import { CONTROLS_ANIMATION_DURATION } from '../../views/CallView/styles';

const styles = StyleSheet.create((_theme, rt) => ({
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 12,
		paddingBottom: 12,
		borderBottomWidth: StyleSheet.hairlineWidth,
		paddingTop: rt.insets.top + 12
	},
	emptyHeader: {
		paddingTop: rt.insets.top
	}
}));

const MediaCallHeader = () => {
	'use memo';

	const { colors } = useTheme();
	const theme = useAnimatedTheme();
	const call = useCallStore(useShallow(state => state.call));
	const focused = useCallStore(state => state.focused);
	const controlsVisible = useControlsVisible();

	const shouldHide = focused && !controlsVisible;

	const animatedStyle = useAnimatedStyle(() => ({
		opacity: withTiming(shouldHide ? 0 : 1, { duration: CONTROLS_ANIMATION_DURATION }),
		transform: [
			{
				translateY: withTiming(shouldHide ? -100 : 0, {
					duration: CONTROLS_ANIMATION_DURATION
				})
			}
		],
		backgroundColor: withTiming(shouldHide ? 'transparent' : theme.value.colors.surfaceNeutral, {
			duration: CONTROLS_ANIMATION_DURATION
		}),
		borderBottomColor: withTiming(shouldHide ? 'transparent' : theme.value.colors.strokeLight, {
			duration: CONTROLS_ANIMATION_DURATION
		})
	}));

	if (!call) {
		return <View style={[styles.emptyHeader, { backgroundColor: colors.surfaceNeutral }]} testID='media-call-header-empty' />;
	}

	return (
		<Animated.View
			style={[styles.header, { backgroundColor: colors.surfaceNeutral, borderBottomColor: colors.strokeLight }, animatedStyle]}
			pointerEvents={shouldHide ? 'none' : 'auto'}
			testID='media-call-header'>
			<Collapse />
			<Content />
			<EndCall />
		</Animated.View>
	);
};

export default MediaCallHeader;
