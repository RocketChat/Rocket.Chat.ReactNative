import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	containerView: {
		padding: 16
	},
	containerAvatarAndName: {
		flexDirection: 'row',
		marginBottom: 24,
		alignItems: 'center'
	},
	nameText: {
		marginLeft: 8,
		fontSize: 16,
		...sharedStyles.textMedium
	},
	containerTextInput: {
		marginBottom: 24
	},
	textInput: {
		height: 100,
		textAlignVertical: 'top'
	}
});
