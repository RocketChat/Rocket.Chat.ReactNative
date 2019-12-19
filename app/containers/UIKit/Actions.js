import React, { useState } from 'react';
import { Text } from 'react-native';
import PropTypes from 'prop-types';
import { BLOCK_CONTEXT } from '@rocket.chat/ui-kit';

import { Block } from './Block';

export const Actions = ({
	blockId, appId, elements, parser
}) => {
	const [showMoreVisible, setShowMoreVisible] = useState(
		() => elements.length > 5
	);
	const renderedElements = (showMoreVisible
		? elements.slice(0, 5)
		: elements
	).map(element => parser.renderActions({ blockId, appId, ...element }, BLOCK_CONTEXT.ACTION, parser));

	const handleShowMoreClick = () => {
		setShowMoreVisible(false);
	};

	return (
		<Block>
			{renderedElements}
			{showMoreVisible && (<Text onPress={handleShowMoreClick}>Show more...</Text>)}
		</Block>
	);
};

Actions.propTypes = {
	blockId: PropTypes.string,
	appId: PropTypes.string,
	elements: PropTypes.array,
	parser: PropTypes.any
};
