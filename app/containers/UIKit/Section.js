import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { BLOCK_CONTEXT } from '@rocket.chat/ui-kit';

import { themes } from '../../constants/colors';
import sharedStyles from '../../views/Styles';

const styles = StyleSheet.create({
	content: {
		marginBottom: 8
	},
	row: {
		flexDirection: 'row'
	},
	column: {
		justifyContent: 'center'
	},
	text: {
		flex: 1,
		padding: 4,
		fontSize: 16,
		lineHeight: 22,
		textAlignVertical: 'center',
		...sharedStyles.textRegular
	},
	field: {
		marginVertical: 6
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
	<Text style={[styles.text, styles.field, { color: themes[theme].bodyText }]}>
		{parser.text(field)}
	</Text>
));

const accessoriesRight = ['image', 'overflow'];

export const Section = ({
	blockId, appId, text, fields, accessory, parser, theme
}) => (
	<View
		style={[
			styles.content,
			accessory && accessoriesRight.includes(accessory.type) ? styles.row : styles.column
		]}
	>
		{text ? <Text style={[styles.text, { color: themes[theme].bodyText }]}>{parser.text(text)}</Text> : null}
		{fields ? <Fields fields={fields} theme={theme} parser={parser} /> : null}
		{accessory ? <Accessory element={{ blockId, appId, ...accessory }} parser={parser} /> : null}
	</View>
);
Section.propTypes = {
	blockId: PropTypes.string,
	appId: PropTypes.string,
	text: PropTypes.object,
	fields: PropTypes.array,
	accessory: PropTypes.any,
	theme: PropTypes.string,
	parser: PropTypes.object
};
