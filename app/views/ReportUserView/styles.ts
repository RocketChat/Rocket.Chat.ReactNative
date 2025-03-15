import { StyleSheet } from 'react-native';

export default StyleSheet.create({
	container: {
		flex: 1
	},
	scroll: {
		flex: 1
	},
	containerView: {
		flex: 1,
		paddingHorizontal: 20,
		paddingTop: 24
	},
	avatar: {
		width: 48,
		height: 48,
		borderRadius: 6
	},
	labelText: {
		fontSize: 16,
		lineHeight: 22,
		marginBottom: 12,
		fontWeight: '500'
	},
	containerTextInput: {
		marginBottom: 36
	},
	textInput: {
		minHeight: 120,
		maxHeight: 480,
		height: undefined,
		textAlignVertical: 'top',
		padding: 16,
		borderRadius: 8,
		fontSize: 16
	},
	buttonContainer: {
		marginBottom: 36
	},
	reportButton: {
		height: 50,
		borderRadius: 8
	},
	reportButtonText: {
		fontSize: 16,
		fontWeight: '600'
	},

	containerAvatarAndName: {
		flexDirection: 'row',
		marginBottom: 24,
		alignItems: 'center',
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 10
	},
	userTextContainer: {
		flexDirection: 'column',
		marginLeft: 12,
		flex: 1,
		justifyContent: 'center'
	},
	nameText: {
		fontSize: 16,
		lineHeight: 20,
		fontWeight: '600'
	},
	usernameText: {
		fontSize: 13,
		lineHeight: 18,
		marginTop: 2
	},
	statusText: {
		fontSize: 12,
		marginTop: 4
	}
});
