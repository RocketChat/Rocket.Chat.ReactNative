import React from 'react';
import { Text } from 'react-native';
import Touchable from 'react-native-platform-touchable';

import styles from './styles';
import { useTheme } from '../../theme';
import { AVAILABLE_SPEEDS } from './constants';

const PlaybackSpeed = ({
	onChange,
	loaded = false,
	rateIndex = 0
}: {
	onChange: (value: number) => void;
	loaded: boolean;
	rateIndex: number;
}) => {
	const { colors } = useTheme();

	const onPress = () => {
		const nextRateIndex = rateIndex >= AVAILABLE_SPEEDS.length ? 0 : rateIndex + 1;
		onChange(AVAILABLE_SPEEDS[nextRateIndex]);
	};

	return (
		<Touchable
			disabled={!loaded}
			onPress={onPress}
			style={[styles.containerPlaybackSpeed, { backgroundColor: colors.buttonBackgroundSecondaryDefault }]}
		>
			<Text style={[styles.playbackSpeedText, { color: colors.buttonFontSecondary }]}>{AVAILABLE_SPEEDS[rateIndex]}x</Text>
		</Touchable>
	);
};

export default PlaybackSpeed;
