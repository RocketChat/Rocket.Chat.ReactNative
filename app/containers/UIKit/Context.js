import React from 'react';
import { View, Text } from 'react-native';
import PropTypes from 'prop-types';
import { BLOCK_CONTEXT } from '@rocket.chat/ui-kit';
import { Block } from './Block';

export const Context = ({ elements, parser }) => elements.map(element => (
	<View style={{ alignItems: 'center' }}>
		<Block>
			<Text>
				{parser.renderContext(element, BLOCK_CONTEXT.CONTEXT, parser)}
			</Text>
		</Block>
	</View>
));
Context.propTypes = {
	elements: PropTypes.array,
	parser: PropTypes.object
};
