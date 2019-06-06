import { StyleSheet } from 'react-native';

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
	name: {
		color: COLOR_TITLE
	},
	content: {
		flex: 1,
		backgroundColor: COLOR_WHITE,
		paddingHorizontal: 16
	},
	input: {
		flex: 1,
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
