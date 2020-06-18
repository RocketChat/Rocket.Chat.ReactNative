import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';

const THUMB_SIZE = 64;

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
	// Media
	list: {
		height: 86,
		paddingVertical: 8,
		paddingHorizontal: 8
	},
	play: {
		position: 'absolute',
		left: 8,
		top: 16
	},
	remove: {
		position: 'absolute',
		right: 4,
		padding: 4,
		borderWidth: 2,
		borderRadius: 14
	},
	item: {
		paddingTop: 8
	},
	thumb: {
		width: THUMB_SIZE,
		height: THUMB_SIZE,
		borderRadius: 2,
		marginRight: 16
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
	// Header
	header: {
		width: '70%',
		justifyContent: 'center',
		flexDirection: 'row'
	},
	text: {
		fontSize: 16,
		...sharedStyles.textRegular,
		marginRight: 4
	},
	name: {
		fontSize: 16,
		...sharedStyles.textSemibold
	},
	send: {
		...sharedStyles.textSemibold,
		fontSize: 16
	}
});
