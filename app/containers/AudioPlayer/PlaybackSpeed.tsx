import React from 'react';
import { Text } from 'react-native';
import Touchable from 'react-native-platform-touchable';

import styles from './styles';
import { useTheme } from '../../theme';

const PlaybackSpeed = ({
	onChange,
	loaded = false,
	rate = 1
}: {
	onChange: (value: number) => void;
	loaded: boolean;
	rate: number;
}) => {
	const { colors } = useTheme();

	const onPress = () => {
		const nextRate = rate === 2 ? 0.5 : rate + 0.5;
		onChange(nextRate);
	};

	return (
		<Touchable
			disabled={!loaded}
			onPress={onPress}
			style={[styles.containerPlaybackSpeed, { backgroundColor: colors.buttonBackgroundSecondaryDefault }]}
		>
			<Text style={[styles.playbackSpeedText, { color: colors.buttonFontSecondary }]}>{rate}x</Text>
		</Touchable>
	);
};

export default PlaybackSpeed;
