import { StyleSheet } from 'react-native';

import { fontSize } from '../../lib/theme';
import sharedStyles from '../Styles';

export default StyleSheet.create({
	container: {
		flex: 1,
		padding: 8
	},
	multiline: {
		height: 130
	},
	label: {
		marginBottom: 10,
		fontSize: fontSize[14],
		...sharedStyles.textMedium
	},
	inputStyle: {
		marginBottom: 16
	},
	description: {
		paddingBottom: 16
	}
});
