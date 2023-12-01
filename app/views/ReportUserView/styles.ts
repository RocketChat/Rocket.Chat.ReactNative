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
	textInput: {
		height: 100,
		textAlignVertical: 'top'
	},
	labelTextInput: {
		marginBottom: 4,
		fontSize: 14,
		...sharedStyles.textMedium
	}
});
