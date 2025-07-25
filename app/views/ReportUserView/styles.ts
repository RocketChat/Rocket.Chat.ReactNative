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
		paddingHorizontal: 16,
		paddingTop: 32
	},
	containerAvatarAndName: {
		flexDirection: 'row',
		marginBottom: 24,
		alignItems: 'center'
	},
	nameText: {
		marginLeft: 8,
		fontSize: 16,
		lineHeight: 24,
		...sharedStyles.textBold
	},
	containerTextInput: {
		marginBottom: 36
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
