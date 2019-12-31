import React from 'react';
import PropTypes from 'prop-types';
import { BLOCK_CONTEXT } from '@rocket.chat/ui-kit';

import { Block } from './Block';

export const Input = ({ element, parser }) => (
	<Block>
		{parser.renderInputs({ ...element }, BLOCK_CONTEXT.FORM, parser)}
	</Block>
);

Input.propTypes = {
	element: PropTypes.object,
	parser: PropTypes.object
};
