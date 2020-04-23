import React from 'react';
import { Text } from 'react-native';
import PropTypes from 'prop-types';

import styles from './styles';
import { themes } from '../../../constants/colors';
import Touch from '../../../utils/touch';

const Button = ({
	text, disabled, theme, onPress
}) => (
	<Touch
		style={[styles.buttonCircle, { backgroundColor: themes[theme].backgroundColor, borderColor: themes[theme].borderColor }]}
		disabled={disabled}
		theme={theme}
		onPress={() => onPress && onPress(text)}
	>
		<Text style={[styles.text, { color: themes[theme].titleText }]}>
			{text}
		</Text>
	</Touch>
);

Button.propTypes = {
	text: PropTypes.string,
	theme: PropTypes.string,
	disabled: PropTypes.bool,
	onPress: PropTypes.func
};

export default Button;
