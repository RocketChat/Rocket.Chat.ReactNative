import React from 'react';
import { Text } from 'react-native';
import PropTypes from 'prop-types';
import { BLOCK_CONTEXT } from '@rocket.chat/ui-kit';

import { Block } from './Block';

export const Input = ({ label, element, parser }) => (
	<Block>
		{label && <Text>{label}</Text>}
		{parser.renderInputs(element, BLOCK_CONTEXT.FORM, parser)}
	</Block>
);

Input.propTypes = {
	label: PropTypes.string,
	element: PropTypes.object,
	parser: PropTypes.any
};
