import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { BLOCK_CONTEXT } from '@rocket.chat/ui-kit';

import { Block } from './Block';

const styles = StyleSheet.create({
	content: {
		marginBottom: 8
	}
});

const Accessory = ({
	blockId, appId, element, parser
}) => parser.renderAccessories(
	{ blockId, appId, ...element },
	BLOCK_CONTEXT.SECTION,
	parser
);

const Fields = ({ fields, parser }) => fields.map(field => (
	<View>
		<Text>
			{parser.text(field)}
		</Text>
	</View>
));

export const Section = ({
	blockId, appId, text, fields, accessory, parser
}) => (
	<Block>
		<View style={styles.content}>
			{text ? <Text>{parser.text(text)}</Text> : null}
			{fields ? <Fields fields={fields} parser={parser} /> : null}
		</View>
		{accessory ? <Accessory element={{ blockId, appId, ...accessory }} parser={parser} /> : null}
	</Block>
);
Section.propTypes = {
	blockId: PropTypes.string,
	appId: PropTypes.string,
	text: PropTypes.object,
	fields: PropTypes.array,
	accessory: PropTypes.any,
	parser: PropTypes.any
};
