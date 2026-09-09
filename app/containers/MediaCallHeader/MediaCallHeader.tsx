import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';

import { useTheme } from '../../theme';
import Collapse from './components/Collapse';
import ConferenceCallRow from './components/ConferenceCallRow';
import EndCall from './components/EndCall';
import { useConferenceCallStore } from '../../lib/services/conference/useConferenceCallStore';
import { useCallStore, useControlsVisible } from '../../lib/services/voip/useCallStore';
import { Content } from './components/Content';
import { CONTROLS_ANIMATION_DURATION } from '../../views/CallView/styles';

const styles = StyleSheet.create({
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 12,
		paddingBottom: 12,
		borderBottomWidth: StyleSheet.hairlineWidth
	}
});

const MediaCallHeader = () => {
	const { colors } = useTheme();
	const insets = useSafeAreaInsets();
	const call = useCallStore(useShallow(state => state.call));
	const conferenceCallId = useConferenceCallStore(state => state.callId);
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
		backgroundColor: withTiming(shouldHide ? 'transparent' : colors.surfaceNeutral, { duration: CONTROLS_ANIMATION_DURATION }),
		borderBottomColor: withTiming(shouldHide ? 'transparent' : colors.strokeLight, { duration: CONTROLS_ANIMATION_DURATION })
	}));

	const defaultHeaderStyle = {
		backgroundColor: colors.surfaceNeutral,
		paddingTop: insets.top
	};

	const rowStyle = { ...defaultHeaderStyle, borderBottomColor: colors.strokeLight, paddingTop: insets.top + 12 };

	if (!call) {
		// A conference call gets the same header, so returning to one works the way returning to a
		// VoIP call does. It never auto-hides: the conference webview covers this header when
		// expanded, so the header is only on screen while the call is minimized.
		if (conferenceCallId) {
			return (
				<View style={[styles.header, rowStyle]} testID='conference-call-header'>
					<ConferenceCallRow />
				</View>
			);
		}

		return <View style={defaultHeaderStyle} testID='media-call-header-empty' />;
	}

	return (
		<Animated.View
			style={[styles.header, rowStyle, animatedStyle]}
			pointerEvents={shouldHide ? 'none' : 'auto'}
			testID='media-call-header'>
			<Collapse />
			<Content />
			<EndCall />
		</Animated.View>
	);
};

export default MediaCallHeader;
