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
		padding: 16,
		backgroundColor: COLOR_BACKGROUND_CONTAINER,
		alignItems: 'center'
	},
	mediaImage: {
		height: 64,
		width: 64
	},
	mediaIcon: {
		fontSize: 64,
		...sharedStyles.textColorNormal
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
		...sharedStyles.textColorNormal,
		...sharedStyles.textRegular
	},
	mediaInputContent: {
		width: '100%',
		...sharedStyles.separatorVertical,
		backgroundColor: COLOR_WHITE
	},
	input: {
		fontSize: 16,
		...sharedStyles.textColorNormal,
		...sharedStyles.textRegular,
		backgroundColor: COLOR_WHITE
	},
	textInput: {
		flex: 1,
		paddingHorizontal: 16
	},
	mediaNameInput: {
		marginLeft: 16,
		paddingRight: 16,
		paddingVertical: 8,
		backgroundColor: COLOR_WHITE,
		...sharedStyles.separatorBottom
	},
	mediaDescriptionInput: {
		marginLeft: 16,
		paddingRight: 16,
		marginVertical: 8,
		backgroundColor: COLOR_WHITE,
		height: 100
	},
	send: {
		...sharedStyles.textColorHeaderBack,
		...sharedStyles.textSemibold,
		fontSize: 16
	}
});
