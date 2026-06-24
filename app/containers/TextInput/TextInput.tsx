import { forwardRef } from 'react';
import { I18nManager, type StyleProp, TextInput as RNTextInput, type TextStyle } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { type IRCTextInputProps } from './FormTextInput';
import { themes } from '../../lib/constants/colors';
import { useTheme } from '../../theme';

const styles = StyleSheet.create(theme => ({
	input: {
		...(I18nManager.isRTL ? { textAlign: 'right' } : { textAlign: 'auto' }),
		color: theme.colors.fontTitlesLabels
	}
}));

export interface IThemedTextInput extends IRCTextInputProps {
	style: StyleProp<TextStyle>;
}

export const TextInput = forwardRef<RNTextInput, IThemedTextInput>(({ style, ...props }, ref) => {
	const { theme } = useTheme();
	return (
		<RNTextInput
			ref={ref}
			style={[style, styles.input]}
			placeholderTextColor={themes[theme].fontSecondaryInfo}
			keyboardAppearance={theme === 'light' ? 'light' : 'dark'}
			{...props}
		/>
	);
});
