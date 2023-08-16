import React, { useState } from 'react';
import { Text } from 'react-native';

import styles from './styles';
import { useTheme } from '../../../../theme';
import Touchable from '../../Touchable';

const AudioRate = ({
	onChange,
	loaded = false,
	rate: rateProps = 1
}: {
	onChange: (value: number) => void;
	loaded: boolean;
	rate: number;
}) => {
	const [rate, setRate] = useState(rateProps);
	const { colors } = useTheme();

	const onPress = () => {
		const nextRate = rate === 2 ? 0.5 : rate + 0.5;
		setRate(nextRate);
		onChange(nextRate);
	};

	return (
		<Touchable
			disabled={!loaded}
			onPress={onPress}
			style={[styles.containerAudioRate, { backgroundColor: colors.audioRateBackground }]}
		>
			<Text style={[styles.audioRateText, { color: colors.audioRateText }]}>{rate}x</Text>
		</Touchable>
	);
};

export default AudioRate;
