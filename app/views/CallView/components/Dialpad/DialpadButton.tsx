import React from 'react';
import { Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { useCallStore } from '../../../../lib/services/voip/useCallStore';
import { useTheme } from '../../../../theme';
import { useDialpadAudio } from './DialpadContext';
import { styles } from './styles';

interface IDialpadButton {
	digit: string;
	letters: string;
	testID?: string;
}

const DialpadButton = ({ digit, letters, testID }: IDialpadButton): React.ReactElement => {
	'use memo';

	const { colors } = useTheme();
	const setDialpadValue = useCallStore(state => state.setDialpadValue);
	const { playTone, stopTone } = useDialpadAudio();

	const handlePressIn = () => {
		setDialpadValue(digit);
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		playTone(digit);
	};

	const handlePressOut = () => {
		stopTone(digit);
	};

	const isLargeDigit = ['*', '#'].includes(digit);

	return (
		<Pressable
			onPressIn={handlePressIn}
			onPressOut={handlePressOut}
			testID={testID ?? `dialpad-button-${digit}`}
			accessibilityLabel={letters ? `${digit} ${letters}` : digit}
			accessibilityRole='button'
			style={({ pressed }) => [
				styles.button,
				{ backgroundColor: pressed ? colors.buttonBackgroundSecondaryPress : colors.buttonBackgroundSecondaryDefault }
			]}>
			<View style={styles.digitContainer}>
				<Text style={[styles.digit, isLargeDigit && styles.digitLarge, { color: colors.fontDefault }]}>{digit}</Text>
				{!isLargeDigit ? <Text style={[styles.letters, { color: colors.fontSecondaryInfo }]}>{letters || ''}</Text> : null}
			</View>
		</Pressable>
	);
};

export default DialpadButton;
