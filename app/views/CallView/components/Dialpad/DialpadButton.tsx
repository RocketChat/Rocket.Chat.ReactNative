import { Pressable, View } from 'react-native';
import { PlainText } from 'react-native-plain-text';
import * as Haptics from 'expo-haptics';
import type { ReactElement } from 'react';

import { useCallStore } from '~/lib/services/voip/useCallStore';
import { useTheme } from '~/theme';
import { useDialpadAudio } from './DialpadContext';
import { styles } from './styles';

interface IDialpadButton {
	digit: string;
	letters: string;
	testID?: string;
}

const DialpadButton = ({ digit, letters, testID }: IDialpadButton): ReactElement => {
	const { colors } = useTheme();
	const setDialpadValue = useCallStore(state => state.setDialpadValue);
	const { playTone } = useDialpadAudio();

	const handlePressIn = () => {
		setDialpadValue(digit);
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		playTone(digit);
	};

	const isLargeDigit = ['*', '#'].includes(digit);

	return (
		<Pressable
			onPressIn={handlePressIn}
			testID={testID ?? `dialpad-button-${digit}`}
			accessibilityLabel={letters ? `${digit} ${letters}` : digit}
			accessibilityRole='button'
			style={({ pressed }) => [
				styles.button,
				{ backgroundColor: pressed ? colors.buttonBackgroundSecondaryPress : colors.buttonBackgroundSecondaryDefault }
			]}>
			<View style={styles.digitContainer}>
				<PlainText style={[styles.digit, isLargeDigit && styles.digitLarge, { color: colors.fontDefault }]}>{digit}</PlainText>
				{!isLargeDigit ? (
					<PlainText style={[styles.letters, { color: colors.fontSecondaryInfo }]}>{letters || ''}</PlainText>
				) : null}
			</View>
		</Pressable>
	);
};

export default DialpadButton;
