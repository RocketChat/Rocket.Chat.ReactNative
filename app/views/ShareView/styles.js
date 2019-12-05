import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	container: {
		flex: 1
	},
	centered: {
		justifyContent: 'center',
		alignItems: 'center'
	},
	title: {
		fontSize: 18,
		...sharedStyles.textBold,
		...sharedStyles.textAlignCenter
	},
	text: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		...sharedStyles.textRegular
	},
	to: {
		...sharedStyles.textRegular
	},
	toContent: {
		width: '100%'
	},
	toContentText: {
		width: '100%',
		...sharedStyles.textRegular
	},
	name: {
		...sharedStyles.textRegular
	},
	content: {
		flex: 1
	},
	mediaContainer: {
		flex: 1
	},
	mediaContent: {
		flexDirection: 'row',
		padding: 16,
		alignItems: 'center',
		...sharedStyles.separatorTop
	},
	mediaImage: {
		height: 64,
		width: 64
	},
	mediaIcon: {
		fontSize: 64
	},
	mediaIconContainer: {
		alignItems: 'center',
		justifyContent: 'center'
	},
	mediaInfo: {
		marginLeft: 16,
		flex: 1
	},
	mediaText: {
		fontSize: 16,
		...sharedStyles.textRegular
	},
	mediaInputContent: {
		width: '100%'
	},
	input: {
		fontSize: 16,
		...sharedStyles.textRegular
	},
	inputContainer: {
		marginBottom: 0
	},
	firstInput: {
		borderBottomWidth: 0
	},
	textInput: {
		height: '100%'
	},
	mediaNameInput: {
		paddingLeft: 16,
		paddingRight: 16,
		paddingVertical: 8
	},
	mediaDescriptionInput: {
		paddingLeft: 16,
		paddingRight: 16,
		paddingVertical: 8,
		height: 100
	},
	send: {
		...sharedStyles.textSemibold,
		fontSize: 16
	}
});
