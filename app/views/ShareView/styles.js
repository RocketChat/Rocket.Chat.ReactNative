import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	container: {
		flex: 1
	},
	// Preview
	video: {
		width: '100%',
		height: '100%'
	},
	// Thumbs
	thumbs: {
		height: 86
	},
	// Text
	input: {
		fontSize: 16,
		...sharedStyles.textRegular
	},
	inputContainer: {
		marginBottom: 0
	},
	textInput: {
		height: '100%'
	},
	// Error
	centered: {
		justifyContent: 'center',
		alignItems: 'center'
	},
	title: {
		fontSize: 18,
		...sharedStyles.textBold,
		...sharedStyles.textAlignCenter
	},
	send: {
		...sharedStyles.textSemibold,
		fontSize: 16
	}
});
