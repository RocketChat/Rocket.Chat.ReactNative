import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BLOCK_CONTEXT } from '@rocket.chat/ui-kit';

import { themes } from '../../constants/colors';

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
		padding: 4
	},
	field: {
		marginVertical: 6
	}
});

interface IAccessory {
	blockId?: string;
	appId?: string;
	element: any;
	parser: any;
}

interface IFields {
	fields: any;
	parser: any;
	theme: string;
}

interface ISection {
	blockId: string;
	appId: string;
	text: object;
	fields: [];
	accessory: any;
	theme: string;
	parser: any;
}

const Accessory = ({ blockId, appId, element, parser }: IAccessory) =>
	parser.renderAccessories({ blockId, appId, ...element }, BLOCK_CONTEXT.SECTION, parser);

const Fields = ({ fields, parser, theme }: IFields) =>
	fields.map((field: any) => (
		<Text style={[styles.text, styles.field, { color: themes[theme].bodyText }]}>{parser.text(field)}</Text>
	));

const accessoriesRight = ['image', 'overflow'];

export const Section = ({ blockId, appId, text, fields, accessory, parser, theme }: ISection) => (
	<View style={[styles.content, accessory && accessoriesRight.includes(accessory.type) ? styles.row : styles.column]}>
		{text ? <View style={styles.text}>{parser.text(text)}</View> : null}
		{fields ? <Fields fields={fields} theme={theme} parser={parser} /> : null}
		{accessory ? <Accessory element={{ blockId, appId, ...accessory }} parser={parser} /> : null}
	</View>
);
