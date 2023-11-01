import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

import styles from './styles';
import { useTheme } from '../../theme';
import { AVAILABLE_SPEEDS } from './constants';
import { TAudioState } from './types';

const PlaybackSpeed = ({
	onChange,
	speedIndex = 0,
	audioState
}: {
	onChange: (value: number) => void;
	speedIndex: number;
	audioState: TAudioState;
}) => {
	const { colors } = useTheme();

	const onPress = () => {
		const nextSpeedIndex = speedIndex + 1 >= AVAILABLE_SPEEDS.length ? 0 : speedIndex + 1;
		onChange(AVAILABLE_SPEEDS[nextSpeedIndex]);
	};

	return (
		<TouchableOpacity
			disabled={!(audioState === 'playing')}
			onPress={onPress}
			style={[styles.containerPlaybackSpeed, { backgroundColor: colors.buttonBackgroundSecondaryDefault }]}
		>
			<Text style={[styles.playbackSpeedText, { color: colors.buttonFontSecondary }]}>{AVAILABLE_SPEEDS[speedIndex]}x</Text>
		</TouchableOpacity>
	);
};

export default PlaybackSpeed;
