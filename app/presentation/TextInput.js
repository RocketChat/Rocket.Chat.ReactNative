import React from 'react';
import { TextInput, StyleSheet, I18nManager } from 'react-native';
import PropTypes from 'prop-types';

import { themes } from '../constants/colors';

const styles = StyleSheet.create({
	input: {
		...I18nManager.isRTL
			? { textAlign: 'right' }
			: { textAlign: 'left' }
	}
});

const ThemedTextInput = React.forwardRef(({ style, theme, ...props }, ref) => (
	<TextInput
		ref={ref}
		style={[{ color: themes[theme].titleText }, style, styles.input]}
		placeholderTextColor={themes[theme].auxiliaryText}
		keyboardAppearance={theme === 'light' ? 'light' : 'dark'}
		{...props}
	/>
));

ThemedTextInput.propTypes = {
	style: PropTypes.object,
	theme: PropTypes.string
};

export default ThemedTextInput;
