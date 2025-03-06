import React from 'react';
import { Text } from 'react-native';

import styles from './styles';
import { useTheme } from '../../theme';
import { AUDIO_PLAYBACK_SPEED, AVAILABLE_SPEEDS } from './constants';
import { useUserPreferences } from '../../lib/methods';
import NativeButton from '../NativeButton';

const PlaybackSpeed = () => {
	const [playbackSpeed, setPlaybackSpeed] = useUserPreferences<number>(AUDIO_PLAYBACK_SPEED, AVAILABLE_SPEEDS[1]);
	const { colors } = useTheme();

	const onPress = () => {
		const speedIndex = AVAILABLE_SPEEDS.indexOf(playbackSpeed);
		const nextSpeedIndex = speedIndex + 1 >= AVAILABLE_SPEEDS.length ? 0 : speedIndex + 1;
		setPlaybackSpeed(AVAILABLE_SPEEDS[nextSpeedIndex]);
	};

	return (
		<NativeButton
			onPress={onPress}
			style={[styles.containerPlaybackSpeed, { backgroundColor: colors.buttonBackgroundSecondaryDefault }]}>
			<Text style={[styles.playbackSpeedText, { color: colors.buttonFontSecondary }]}>{playbackSpeed}x</Text>
		</NativeButton>
	);
};

export default PlaybackSpeed;
