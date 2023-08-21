import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	container: {
		flex: 1
	},
	inputContainer: {
		marginTop: 16,
		paddingHorizontal: 16,
		marginBottom: 8
	},
	label: {
		marginBottom: 4,
		fontSize: 14,
		...sharedStyles.textMedium
	},
	messageContainer: {
		paddingVertical: 8
	}
});
