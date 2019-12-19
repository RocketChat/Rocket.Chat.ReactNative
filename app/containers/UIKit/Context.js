import React from 'react';
import PropTypes from 'prop-types';
import { BLOCK_CONTEXT } from '@rocket.chat/ui-kit';
import { Block } from './Block';

export const Context = ({ elements, parser }) => elements.map(element => (
	<Block>
		{parser.renderContext(element, BLOCK_CONTEXT.CONTEXT, parser)}
	</Block>
));
Context.propTypes = {
	elements: PropTypes.array,
	parser: PropTypes.object
};
