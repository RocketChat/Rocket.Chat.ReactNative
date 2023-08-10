import React, { useState } from 'react';
import { Text } from 'react-native';

import styles from './styles';
import { useTheme } from '../../../../theme';
import Touchable from '../../Touchable';

const AudioRate = ({ onChange }: { onChange: (value: number) => void }) => {
	const [rate, setRate] = useState(1.0);
	const { colors } = useTheme();

	const onPress = () => {
		const nextRate = rate === 2.0 ? 0.5 : rate + 0.5;
		setRate(nextRate);
		onChange(nextRate);
	};

	return (
		<Touchable onPress={onPress} style={[styles.containerAudioRate, { backgroundColor: colors.audioRateBackground }]}>
			<Text style={[styles.audioRateText, { color: colors.audioRateText }]}>{rate}x</Text>
		</Touchable>
	);
};

export default AudioRate;
