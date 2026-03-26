import React from 'react';
import { View } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';

import styles from './styles';
import { themes } from '../../lib/constants/colors';
import { useTheme } from '../../theme';

export const Handle = ({ onPress }: { onPress: () => void }) => {
	'use memo';

	const { theme } = useTheme();

	// We should use RectButton from gesture-handler to avoid issues with the keyboard
	return (
		<RectButton
			onPress={onPress}
			style={styles.handle}
			testID='action-sheet-handle'
			accessibilityRole='button'
			accessibilityLabel='Close action sheet'
			accessibilityHint='Dismisses the action sheet'>
			<View style={[styles.handleIndicator, { backgroundColor: themes[theme].fontSecondaryInfo }]} />
		</RectButton>
	);
};
