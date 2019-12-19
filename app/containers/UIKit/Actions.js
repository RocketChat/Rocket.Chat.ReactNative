import React, { useState } from 'react';
import { View, Text } from 'react-native';
import PropTypes from 'prop-types';
import { BLOCK_CONTEXT } from '@rocket.chat/ui-kit';

import { Block } from './Block';

const getStyle = ({ type }) => {
	switch (type) {
		case 'button':// ELEMENT_TYPES.BUTTON :
			return 'auto';
		default:
			return '50%';
	}
};

export const Actions = ({
	blockId, appId, elements, parser
}) => {
	const [showMoreVisible, setShowMoreVisible] = useState(
		() => elements.length > 5
	);
	const renderedElements = (showMoreVisible
		? elements.slice(0, 5)
		: elements
	).map(element => <View basis={getStyle(element)}>{parser.renderActions({ blockId, appId, ...element }, BLOCK_CONTEXT.ACTION, parser)}</View>);

	const handleShowMoreClick = () => {
		setShowMoreVisible(false);
	};

	return (
		<Block>
			<View>
				{renderedElements}
				{showMoreVisible && (<View><Text onPress={handleShowMoreClick}>Show more...</Text></View>)}
			</View>
		</Block>
	);
};

Actions.propTypes = {
	blockId: PropTypes.string,
	appId: PropTypes.string,
	elements: PropTypes.array,
	parser: PropTypes.any
};
