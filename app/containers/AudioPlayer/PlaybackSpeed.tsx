import React from 'react';
import { Text } from 'react-native';

import i18n from '../../i18n';
import styles from './styles';
import { useTheme } from '../../theme';
import { AUDIO_PLAYBACK_SPEED, AVAILABLE_SPEEDS } from './constants';
import { useUserPreferences } from '../../lib/methods/userPreferences';
import NativeButton from '../NativeButton';
import { useResponsiveLayout } from '../../lib/hooks/useResponsiveLayout/useResponsiveLayout';

const PlaybackSpeed = () => {
	const [playbackSpeed, setPlaybackSpeed] = useUserPreferences<number>(AUDIO_PLAYBACK_SPEED, AVAILABLE_SPEEDS[1]);
	const { colors } = useTheme();
	const { scaleFontSize } = useResponsiveLayout();

	const onPress = () => {
		const speedIndex = AVAILABLE_SPEEDS.indexOf(playbackSpeed as number);
		const nextSpeedIndex = speedIndex + 1 >= AVAILABLE_SPEEDS.length ? 0 : speedIndex + 1;
		setPlaybackSpeed(AVAILABLE_SPEEDS[nextSpeedIndex]);
	};

	return (
		<NativeButton
			accessible
			accessibilityLabel={i18n.t('Playback_speed', { playbackSpeed: `${playbackSpeed}x` })}
			onPress={onPress}
			style={[styles.containerPlaybackSpeed, { backgroundColor: colors.buttonBackgroundSecondaryDefault }]}>
			<Text style={[styles.playbackSpeedText, { color: colors.buttonFontSecondary, fontSize: scaleFontSize(14) }]}>{playbackSpeed}x</Text>
		</NativeButton>
	);
};

export default PlaybackSpeed;
