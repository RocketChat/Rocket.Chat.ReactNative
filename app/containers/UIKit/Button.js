import React from 'react';
import PropTypes from 'prop-types';

import RCButton from '../Button';
import { extractText } from './utils';

export const Button = ({ element, action }) => {
	const { text, value } = element;
	return (
		<RCButton
			title={extractText(text)}
			onPress={() => action({ value })}
			theme='light'
		/>
	);
};
Button.propTypes = {
	element: PropTypes.object,
	action: PropTypes.func
};
