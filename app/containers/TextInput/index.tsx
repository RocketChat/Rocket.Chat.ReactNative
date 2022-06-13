import React from 'react';
import { I18nManager, StyleProp, StyleSheet, TextInput, TextStyle } from 'react-native';

import { IRCTextInputProps } from './FormTextInput';
import { themes } from '../../lib/constants';
import { TSupportedThemes } from '../../theme';

const styles = StyleSheet.create({
	input: {
		...(I18nManager.isRTL ? { textAlign: 'right' } : { textAlign: 'auto' })
	}
});

export interface IThemedTextInput extends IRCTextInputProps {
	style: StyleProp<TextStyle>;
	theme: TSupportedThemes;
}

const ThemedTextInput = React.forwardRef<TextInput, IThemedTextInput>(({ style, theme, ...props }, ref) => (
	<TextInput
		ref={ref}
		style={[{ color: themes[theme].titleText }, style, styles.input]}
		placeholderTextColor={themes[theme].auxiliaryText}
		keyboardAppearance={theme === 'light' ? 'light' : 'dark'}
		{...props}
	/>
));

export default ThemedTextInput;
