import React from 'react';
import { I18nManager, StyleSheet, TextInput, TextInputProps } from 'react-native';

import { themes } from '../constants/colors';

const styles = StyleSheet.create({
	input: {
		...(I18nManager.isRTL ? { textAlign: 'right' } : { textAlign: 'auto' })
	}
});

interface IThemedTextInput extends TextInputProps {
	style: object;
	theme: string;
}

const ThemedTextInput = React.forwardRef(({ style, theme, ...props }: IThemedTextInput, ref: any) => (
	<TextInput
		ref={ref}
		style={[{ color: themes[theme].titleText }, style, styles.input]}
		placeholderTextColor={themes[theme].auxiliaryText}
		keyboardAppearance={theme === 'light' ? 'light' : 'dark'}
		{...props}
	/>
));

export default ThemedTextInput;
