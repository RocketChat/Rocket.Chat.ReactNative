import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import AvatarContainer from '../../../containers/Avatar';
import I18n from '../../../i18n';
import { useCallContact, useCallStore, useControlsVisible } from '../../../lib/services/voip/useCallStore';
import { useIsScreenReaderEnabled } from '../../../lib/hooks/useIsScreenReaderEnabled';
import { useResponsiveLayout } from '../../../lib/hooks/useResponsiveLayout/useResponsiveLayout';
import { CONTROLS_ANIMATION_DURATION, styles } from '../styles';
import { useTheme } from '../../../theme';

const CallerInfo = (): React.ReactElement => {
	const { colors } = useTheme();
	const contact = useCallContact();
	const toggleControlsVisible = useCallStore(state => state.toggleControlsVisible);
	const controlsVisible = useControlsVisible();
	const isScreenReaderEnabled = useIsScreenReaderEnabled();
	const { width, height } = useResponsiveLayout();
	const isLandscape = width > height;

	const callerRowStyle = useAnimatedStyle(() => ({
		opacity: withTiming(controlsVisible ? 1 : 0, { duration: CONTROLS_ANIMATION_DURATION }),
		transform: [{ translateY: withTiming(controlsVisible ? 0 : 10, { duration: CONTROLS_ANIMATION_DURATION }) }]
	}));

	const name = contact.displayName || contact.username || I18n.t('Unknown');
	const avatarText = contact.username || name;

	return (
		<Pressable
			style={[styles.callerInfoContainer, isLandscape && styles.callerInfoContainerLandscape]}
			testID='caller-info-toggle'
			onPress={isScreenReaderEnabled ? undefined : toggleControlsVisible}
			accessibilityLabel={I18n.t('Toggle_call_controls')}
			accessibilityRole='button'>
			<View style={styles.avatarContainer}>
				<AvatarContainer text={avatarText} size={isLandscape ? 80 : 120} borderRadius={2} />
			</View>
			<Animated.View style={[styles.callerRow, callerRowStyle]}>
				<Text style={[styles.caller, { color: colors.fontDefault }]} numberOfLines={1} testID='caller-info-name'>
					{name}
				</Text>
			</Animated.View>
		</Pressable>
	);
};

export default CallerInfo;
