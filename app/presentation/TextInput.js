import React from 'react';
import { TextInput } from 'react-native';
import PropTypes from 'prop-types';

import { themes } from '../constants/colors';

const ThemedTextInput = React.forwardRef(({ style, theme, ...props }, ref) => (
	<TextInput
		ref={ref}
		style={[{ color: themes[theme].titleText }, style]}
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
