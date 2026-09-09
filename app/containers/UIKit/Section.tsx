import { StyleSheet, View } from 'react-native';
import { BlockContext } from '@rocket.chat/ui-kit';

import { type IAccessoryComponent, type IFields, type ISection } from './interfaces';

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

const Accessory = ({ element, parser }: IAccessoryComponent) => parser.renderAccessories({ ...element }, BlockContext.SECTION);

const Fields = ({ fields, parser }: IFields) => (
	<>
		{fields.map((field, index) => (
			<View key={`${field.type || 'field'}-${index}`} style={[styles.text, styles.field]}>
				{parser.text(field)}
			</View>
		))}
	</>
);

const accessoriesRight = ['image', 'overflow'];

export const Section = ({ blockId, appId, text, fields, accessory, parser }: ISection) => {
	return (
		<View style={[styles.content, accessory && accessoriesRight.includes(accessory.type) ? styles.row : styles.column]}>
			{text ? <View style={styles.text}>{parser.text(text)}</View> : null}
			{fields ? <Fields fields={fields} parser={parser} /> : null}
			{accessory ? <Accessory element={{ blockId, appId, ...accessory }} parser={parser} /> : null}
		</View>
	);
};
