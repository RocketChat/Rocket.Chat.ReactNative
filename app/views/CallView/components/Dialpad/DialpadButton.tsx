import React from 'react';
import { Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { useCallStore } from '../../../../lib/services/voip/useCallStore';
import { useTheme } from '../../../../theme';
import { styles } from './styles';

interface IDialpadButton {
	digit: string;
	letters: string;
}

const DialpadButton = ({ digit, letters }: IDialpadButton): React.ReactElement => {
	'use memo';

	const { colors } = useTheme();
	const setDialpadValue = useCallStore(state => state.setDialpadValue);

	const handleDigitPress = () => {
		setDialpadValue(digit);
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
	};

	return (
		<Pressable
			onPress={handleDigitPress}
			style={({ pressed }) => [
				styles.button,
				{ backgroundColor: pressed ? colors.buttonBackgroundSecondaryPress : colors.buttonBackgroundSecondaryDefault }
			]}>
			<View style={styles.digitContainer}>
				<Text style={[styles.digit, { color: colors.fontDefault }]}>{digit}</Text>
				<Text style={[styles.letters, { color: colors.fontSecondaryInfo }]}>{letters || ''}</Text>
			</View>
		</Pressable>
	);
};

export default DialpadButton;
