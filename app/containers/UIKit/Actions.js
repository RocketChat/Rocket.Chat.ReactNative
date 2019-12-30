import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { BLOCK_CONTEXT } from '@rocket.chat/ui-kit';

import { Block } from './Block';

import Button from '../Button';

export const Actions = ({
	blockId, appId, elements, parser
}) => {
	const [showMoreVisible, setShowMoreVisible] = useState(() => elements.length > 5);
	const renderedElements = showMoreVisible ? elements.slice(0, 5) : elements;

	const Elements = () => renderedElements
		.map(element => parser.renderActions({ blockId, appId, ...element }, BLOCK_CONTEXT.ACTION, parser));

	return (
		<Block>
			<Elements />
			{showMoreVisible && (<Button theme='light' title='Show more..' onPress={() => setShowMoreVisible(false)} />)}
		</Block>
	);
};

Actions.propTypes = {
	blockId: PropTypes.string,
	appId: PropTypes.string,
	elements: PropTypes.array,
	parser: PropTypes.any
};
