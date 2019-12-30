import React from 'react';
import {
	View, Text, StyleSheet, Image
} from 'react-native';
import PropTypes from 'prop-types';
import { BLOCK_CONTEXT } from '@rocket.chat/ui-kit';

import { Block } from './Block';

import { themes } from '../../constants/colors';

const styles = StyleSheet.create({
	content: {
		marginBottom: 8
	},
	row: {
		flexDirection: 'row'
	},
	text: {
		flex: 1,
		fontSize: 16,
		lineHeight: 22
	},
	image: {
		right: 0,
		width: 72,
		height: 72
	}
});

const Accessory = ({
	blockId, appId, element, parser
}) => parser.renderAccessories(
	{ blockId, appId, ...element },
	BLOCK_CONTEXT.SECTION,
	parser
);

const Fields = ({ fields, parser, theme }) => fields.map(field => (
	<View>
		<Text style={[styles.text, { color: themes[theme].bodyText }]}>
			{parser.text(field)}
		</Text>
	</View>
));

export const Section = ({
	blockId, appId, text, fields, accessory, parser, theme = 'light'
}) => {
	const sectionWithImage = accessory && accessory.type === 'image';
	return (
		<Block>
			<View style={[styles.content, sectionWithImage && styles.row]}>
				{text ? <Text style={[styles.text, { color: themes[theme].bodyText }]}>{parser.text(text)}</Text> : null}
				{fields ? <Fields fields={fields} theme={theme} parser={parser} /> : null}
				{sectionWithImage ? <Image source={{ uri: accessory.imageUrl }} style={styles.image} /> : null}
			</View>
			{accessory && !sectionWithImage ? <Accessory element={{ blockId, appId, ...accessory }} parser={parser} /> : null}
		</Block>
	);
};
Section.propTypes = {
	blockId: PropTypes.string,
	appId: PropTypes.string,
	text: PropTypes.object,
	fields: PropTypes.array,
	accessory: PropTypes.any,
	theme: PropTypes.string,
	parser: PropTypes.any
};
