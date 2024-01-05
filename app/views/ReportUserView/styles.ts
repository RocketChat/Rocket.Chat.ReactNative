import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	container: {
		...sharedStyles.container
	},
	scroll: {
		flex: 1
	},
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
		minHeight: 100,
		maxHeight: 480,
		height: undefined,
		textAlignVertical: 'top',
		padding: 16,
		paddingTop: 16,
		paddingBottom: 16
	}
});
