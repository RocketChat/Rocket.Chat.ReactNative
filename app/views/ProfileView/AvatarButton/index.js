import React from 'react';
import PropTypes from 'prop-types';
import Touch from '../../../utils/touch';

import styles from './styles';
import { themes } from '../../../constants/colors';

const AvatarButton = ({
	key, child, onPress, disabled = false, theme
}) => (
	<Touch
		key={key}
		testID={key}
		onPress={onPress}
		style={[styles.avatarButton, { opacity: disabled ? 0.5 : 1 }, { backgroundColor: themes[theme].borderColor }]}
		enabled={!disabled}
		theme={theme}
	>
		{child}
	</Touch>
);

AvatarButton.propTypes = {
	key: PropTypes.string,
	child: PropTypes.func,
	onPress: PropTypes.func,
	disabled: PropTypes.bool,
	theme: PropTypes.string
};

export default AvatarButton;
