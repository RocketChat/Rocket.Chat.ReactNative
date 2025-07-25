import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	container: {
		paddingHorizontal: 16,
		paddingVertical: 32
	},
	multiline: {
		height: 130
	},
	label: {
		fontSize: 14,
		lineHeight: 24,
		...sharedStyles.textSemibold
	},
	inputStyle: {
		marginBottom: 0
	},
	description: {
		lineHeight: 24,
		...sharedStyles.textRegular
	},
	required: {
		fontSize: 14,
		...sharedStyles.textMedium
	},
	form: {
		gap: 12,
		paddingTop: 12
	}
});
