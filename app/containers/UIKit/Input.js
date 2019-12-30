import React from 'react';
import PropTypes from 'prop-types';
import { BLOCK_CONTEXT } from '@rocket.chat/ui-kit';

import { Block } from './Block';

export const Input = ({ label, element, parser }) => (
	<Block>
		{parser.renderInputs({ ...element, label }, BLOCK_CONTEXT.FORM, parser)}
	</Block>
);

Input.propTypes = {
	label: PropTypes.string,
	element: PropTypes.object,
	parser: PropTypes.object
};
