import React from 'react';
import { Text } from 'react-native';
import PropTypes from 'prop-types';

import styles from './styles';
import { themes } from '../../../constants/colors';
import Touch from '../../../utils/touch';
import I18n from '../../../i18n';
import { CustomIcon } from '../../../lib/Icons';

const Button = ({
	text, disabled, theme, onPress, del, icon
}) => (
	<Touch
		style={[styles.buttonCircle, { backgroundColor: 'transparent' }]}
		underlayColor={themes[theme].passcodeButtonActive}
		rippleColor={themes[theme].passcodeButtonActive}
		disabled={disabled}
		theme={theme}
		onPress={() => onPress && onPress(text)}
	>
		{
			icon
				? (
					<CustomIcon name={icon} size={36} color={themes[theme].passcodePrimary} />
				)
				: (
					<Text style={[styles.text, { color: themes[theme].passcodePrimary }]}>
						{text}
					</Text>
				)
		}
	</Touch>
);

Button.propTypes = {
	text: PropTypes.string,
	theme: PropTypes.string,
	disabled: PropTypes.bool,
	del: PropTypes.bool,
	onPress: PropTypes.func
};

export default Button;
