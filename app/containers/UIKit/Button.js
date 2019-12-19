import React from 'react';
import PropTypes from 'prop-types';

import RCButton from '../Button';

export const Button = ({ element, action, parser }) => {
	const { text, value } = element;
	return (
		<RCButton
			title={parser.text(text)}
			onPress={() => action({ value })}
			theme='light'
		/>
	);
};
Button.propTypes = {
	element: PropTypes.object,
	parser: PropTypes.object,
	action: PropTypes.func
};
