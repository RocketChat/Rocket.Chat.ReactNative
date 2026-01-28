import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BlockContext } from '@rocket.chat/ui-kit';

import { type IAccessoryComponent, type IFields, type ISection } from './interfaces';
import { useTheme } from '../../theme';

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
		padding: 4
	},
	field: {
		marginVertical: 6
	}
});

const Accessory = ({ element, parser }: IAccessoryComponent) =>
	parser.renderAccessories({ ...element }, BlockContext.SECTION, parser);

const Fields = ({ fields, parser }: IFields) => (
	<>
		{fields.map((field, index) => (
			<View key={index} style={[styles.text, styles.field]}>
				{parser.text(field)}
			</View>
		))}
	</>
);

const accessoriesRight = ['image', 'overflow'];

export const Section = ({ blockId, appId, text, fields, accessory, parser }: ISection) => {
	const { theme } = useTheme();

	return (
		<View style={[styles.content, accessory && accessoriesRight.includes(accessory.type) ? styles.row : styles.column]}>
			{text ? <View style={styles.text}>{parser.text(text)}</View> : null}
			{fields ? <Fields fields={fields} theme={theme} parser={parser} /> : null}
			{accessory ? <Accessory element={{ blockId, appId, ...accessory }} parser={parser} /> : null}
		</View>
	);
};
