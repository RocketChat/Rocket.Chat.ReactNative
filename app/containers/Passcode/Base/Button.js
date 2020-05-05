import React from 'react';
import { Text } from 'react-native';
import PropTypes from 'prop-types';

import styles from './styles';
import { themes } from '../../../constants/colors';
import Touch from '../../../utils/touch';
import { CustomIcon } from '../../../lib/Icons';

const Button = React.memo(({
	text, disabled, theme, onPress, icon
}) => {
	const press = () => onPress && onPress(text);

	return (
		<Touch
			style={[styles.buttonView, { backgroundColor: 'transparent' }]}
			underlayColor={themes[theme].passcodeButtonActive}
			rippleColor={themes[theme].passcodeButtonActive}
			enabled={!disabled}
			theme={theme}
			onPress={press}
		>
			{
				icon
					? (
						<CustomIcon name={icon} size={36} color={themes[theme].passcodePrimary} />
					)
					: (
						<Text style={[styles.buttonText, { color: themes[theme].passcodePrimary }]}>
							{text}
						</Text>
					)
			}
		</Touch>
	);
});

Button.propTypes = {
	text: PropTypes.string,
	icon: PropTypes.string,
	theme: PropTypes.string,
	disabled: PropTypes.bool,
	onPress: PropTypes.func
};

export default Button;
