import React from 'react';
import { I18nManager, type StyleProp, TextInput as RNTextInput, type TextStyle } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { type IRCTextInputProps } from './FormTextInput';
import { themes } from '../../lib/constants/colors';
import { useTheme } from '../../theme';

const styles = StyleSheet.create({
	input: {
		...(I18nManager.isRTL ? { textAlign: 'right' } : { textAlign: 'auto' })
	}
});

export interface IThemedTextInput extends IRCTextInputProps {
	style: StyleProp<TextStyle>;
}

export const TextInput = React.forwardRef<RNTextInput, IThemedTextInput>(({ style, ...props }, ref) => {
	const { theme } = useTheme();
	return (
		<RNTextInput
			ref={ref}
			style={[{ color: themes[theme].fontTitlesLabels }, style, styles.input]}
			placeholderTextColor={themes[theme].fontSecondaryInfo}
			keyboardAppearance={theme === 'light' ? 'light' : 'dark'}
			{...props}
		/>
	);
});
