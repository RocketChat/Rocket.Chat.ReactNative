import React from 'react';
import PropTypes from 'prop-types';

import { Container } from './styles';

const AvatarButton = ({
	key, child, onPress, disabled = false, theme
}) => (
	<Container
		key={key}
		testID={key}
		onPress={onPress}
		disabled={disabled}
		enabled={!disabled}
		theme={theme}
	>
		{child}
	</Container>
);

AvatarButton.propTypes = {
	key: PropTypes.string,
	child: PropTypes.func,
	onPress: PropTypes.func,
	disabled: PropTypes.bool,
	theme: PropTypes.string
};

export default AvatarButton;
