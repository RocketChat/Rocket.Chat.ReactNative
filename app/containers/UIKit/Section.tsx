import { Text, View } from 'react-native';
import { BlockContext } from '@rocket.chat/ui-kit';
import { StyleSheet } from 'react-native-unistyles';

import { type IAccessoryComponent, type IFields, type ISection } from './interfaces';
import { useTheme } from '../../theme';

const styles = StyleSheet.create(theme => ({
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
		marginVertical: 6,
		color: theme.colors.fontDefault
	}
}));

const Accessory = ({ element, parser }: IAccessoryComponent) => parser.renderAccessories({ ...element }, BlockContext.SECTION);

const Fields = ({ fields, parser }: IFields) => (
	<>
		{fields.map((field, index) => (
			<Text key={`${(field as any).type || 'field'}-${index}`} style={[styles.text, styles.field]}>
				{parser.text(field)}
			</Text>
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
