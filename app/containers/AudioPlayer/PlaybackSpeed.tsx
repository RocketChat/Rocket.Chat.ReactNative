import React from 'react';
import { Text, View } from 'react-native';

import i18n from '../../i18n';
import styles from './styles';
import { useTheme } from '../../theme';
import { AUDIO_PLAYBACK_SPEED, AVAILABLE_SPEEDS } from './constants';
import { useUserPreferences } from '../../lib/methods/userPreferences';
import PressableOpacity from '../PressableOpacity';

const PlaybackSpeed = () => {
	const [playbackSpeed, setPlaybackSpeed] = useUserPreferences<number>(AUDIO_PLAYBACK_SPEED, AVAILABLE_SPEEDS[1]);
	const { colors } = useTheme();

	const onPress = () => {
		const speedIndex = AVAILABLE_SPEEDS.indexOf(playbackSpeed as number);
		const nextSpeedIndex = speedIndex + 1 >= AVAILABLE_SPEEDS.length ? 0 : speedIndex + 1;
		setPlaybackSpeed(AVAILABLE_SPEEDS[nextSpeedIndex]);
	};

	return (
		<View style={{ overflow: 'hidden' }}>
			<PressableOpacity
				accessible
				accessibilityLabel={i18n.t('Playback_speed', { playbackSpeed: `${playbackSpeed} x` })}
				onPress={onPress}
				style={[styles.containerPlaybackSpeed, { backgroundColor: colors.buttonBackgroundSecondaryDefault }]}
				disableOpacityOnAndroid>
				<Text style={[styles.playbackSpeedText, { color: colors.buttonFontSecondary }]}>{playbackSpeed}x</Text>
			</PressableOpacity>
		</View>
	);
};

export default PlaybackSpeed;
