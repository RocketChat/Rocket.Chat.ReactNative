import { type ComponentRef, forwardRef } from 'react';
import { I18nManager, type StyleProp, StyleSheet, TextInput as RNTextInput, type TextStyle } from 'react-native';

import { type IRCTextInputProps } from './FormTextInput';
import { themes } from '~/lib/constants/colors';
import { useTheme } from '~/theme';

const styles = StyleSheet.create({
	input: {
		...(I18nManager.isRTL ? { textAlign: 'right' } : { textAlign: 'auto' })
	}
});

export type TextInputInstance = ComponentRef<typeof RNTextInput>;

export interface IThemedTextInput extends IRCTextInputProps {
	style: StyleProp<TextStyle>;
}

export const TextInput = forwardRef<TextInputInstance, IThemedTextInput>(({ style, ...props }, ref) => {
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
