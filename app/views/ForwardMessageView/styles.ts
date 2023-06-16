import { StyleSheet } from 'react-native';

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
		fontSize: 14,
		...sharedStyles.textSemibold
	},
	inputStyle: {
		marginBottom: 16
	},
	description: {
		paddingBottom: 16
	}
});
