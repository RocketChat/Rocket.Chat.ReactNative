import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';
import {
	COLOR_BACKGROUND_CONTAINER, COLOR_WHITE
} from '../../constants/colors';

export default StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: COLOR_BACKGROUND_CONTAINER
	},
	centered: {
		justifyContent: 'center',
		alignItems: 'center'
	},
	title: {
		fontSize: 18,
		...sharedStyles.textBold,
		...sharedStyles.textColorNormal,
		...sharedStyles.textAlignCenter
	},
	text: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		...sharedStyles.textColorNormal,
		...sharedStyles.textRegular
	},
	to: {
		...sharedStyles.textColorDescription,
		...sharedStyles.textRegular
	},
	toContent: {
		width: '100%',
		backgroundColor: COLOR_WHITE
	},
	toContentText: {
		width: '100%',
		backgroundColor: COLOR_BACKGROUND_CONTAINER,
		...sharedStyles.textColorNormal,
		...sharedStyles.textRegular
	},
	name: {
		...sharedStyles.textRegular,
		...sharedStyles.textColorTitle
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
		marginBottom: 10,
		...sharedStyles.textColorNormal,
		...sharedStyles.textRegular
	},
	mediaInputContent: {
		width: '100%',
		...sharedStyles.separatorVertical,
		backgroundColor: COLOR_WHITE
	},
	input: {
		fontSize: 18,
		...sharedStyles.textColorNormal,
		...sharedStyles.textRegular,
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
	send: {
		...sharedStyles.textColorHeaderBack,
		...sharedStyles.textSemibold,
		fontSize: 16
	}
});
