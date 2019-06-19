import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';
import {
	COLOR_BACKGROUND_CONTAINER, COLOR_TEXT_DESCRIPTION, COLOR_TITLE, COLOR_WHITE, HEADER_BACK
} from '../../constants/colors';

export default StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: COLOR_BACKGROUND_CONTAINER
	},
	text: {
		paddingHorizontal: 16,
		paddingVertical: 8
	},
	to: {
		color: COLOR_TEXT_DESCRIPTION
	},
	toContent: {
		width: '100%',
		backgroundColor: COLOR_WHITE
	},
	toContentText: {
		width: '100%',
		backgroundColor: COLOR_BACKGROUND_CONTAINER
	},
	name: {
		color: COLOR_TITLE
	},
	content: {
		flex: 1,
		backgroundColor: COLOR_WHITE
	},
	mediaContainer: {
		flex: 1,
		backgroundColor: COLOR_BACKGROUND_CONTAINER
	},
	mediaContent: {
		flexDirection: 'row',
		paddingHorizontal: 16,
		paddingVertical: 9,
		backgroundColor: COLOR_BACKGROUND_CONTAINER
	},
	mediaIcon: {
		height: 80,
		width: 80
	},
	mediaInfo: {
		marginLeft: 9
	},
	mediaText: {
		fontSize: 18,
		marginBottom: 10
	},
	mediaInputContent: {
		width: '100%',
		...sharedStyles.separatorVertical,
		backgroundColor: COLOR_WHITE
	},
	input: {
		fontSize: 18,
		backgroundColor: COLOR_WHITE
	},
	textInput: {
		flex: 1,
		paddingHorizontal: 16
	},
	mediaNameInput: {
		marginLeft: 24,
		paddingRight: 24,
		paddingVertical: 12,
		backgroundColor: COLOR_WHITE,
		...sharedStyles.separatorBottom
	},
	mediaDescriptionInput: {
		marginLeft: 24,
		marginVertical: 12,
		paddingRight: 24,
		height: 100,
		backgroundColor: COLOR_WHITE
	},
	sendButton: {
		marginRight: 16
	},
	send: {
		color: HEADER_BACK,
		fontWeight: '600',
		fontSize: 16
	}
});
