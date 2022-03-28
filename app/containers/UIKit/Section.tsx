import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BLOCK_CONTEXT } from '@rocket.chat/ui-kit';

import { themes } from '../../constants/colors';
import { IAccessoryComponent, IFields, ISection } from './interfaces';

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

const Accessory = ({ element, parser }: IAccessoryComponent) =>
	parser.renderAccessories({ ...element }, BLOCK_CONTEXT.SECTION, parser);

const Fields = ({ fields, parser, theme }: IFields) => (
	<>
		{fields.map(field => (
			<Text style={[styles.text, styles.field, { color: themes[theme].bodyText }]}>{parser.text(field)}</Text>
		))}
	</>
);

const accessoriesRight = ['image', 'overflow'];

export const Section = ({ blockId, appId, text, fields, accessory, parser, theme }: ISection) => (
	<View style={[styles.content, accessory && accessoriesRight.includes(accessory.type) ? styles.row : styles.column]}>
		{text ? <View style={styles.text}>{parser.text(text)}</View> : null}
		{fields ? <Fields fields={fields} theme={theme} parser={parser} /> : null}
		{accessory ? <Accessory element={{ blockId, appId, ...accessory }} parser={parser} /> : null}
	</View>
);
