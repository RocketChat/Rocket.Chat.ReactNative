import { StyleSheet } from 'react-native';

import { fontSize } from '../../lib/theme';
import sharedStyles from '../Styles';

export default StyleSheet.create({
	container: {
		flex: 1
	},
	input: {
		fontSize: 15,
		...sharedStyles.textRegular
	},
	inputContainer: {
		marginBottom: 0
	},
	textInput: {
		height: '100%'
	},
	centered: {
		justifyContent: 'center',
		alignItems: 'center'
	},
	title: {
		fontSize: fontSize[16],
		...sharedStyles.textBold,
		...sharedStyles.textAlignCenter
	},
	send: {
		...sharedStyles.textMedium,
		fontSize: 15
	}
});
