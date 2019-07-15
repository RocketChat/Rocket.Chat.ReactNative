import { StyleSheet, PixelRatio } from 'react-native';

import sharedStyles from '../../views/Styles';
import {
	COLOR_SEPARATOR, COLOR_PRIMARY, COLOR_WHITE, COLOR_UNREAD, COLOR_TEXT
} from '../../constants/colors';

export const ROW_HEIGHT = 75 * PixelRatio.getFontScale();
export const ACTION_WIDTH = 80;
export const SMALL_SWIPE = ACTION_WIDTH / 2;
export const LONG_SWIPE = ACTION_WIDTH * 3;

export default StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingLeft: 14,
		height: ROW_HEIGHT
	},
	button: {
		backgroundColor: COLOR_WHITE
	},
	centerContainer: {
		flex: 1,
		paddingVertical: 10,
		paddingRight: 14,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderColor: COLOR_SEPARATOR
	},
	title: {
		flex: 1,
		fontSize: 17,
		lineHeight: 20,
		...sharedStyles.textColorNormal,
		...sharedStyles.textMedium
	},
	alert: {
		...sharedStyles.textSemibold
	},
	row: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'flex-start'
	},
	titleContainer: {
		width: '100%',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center'
	},
	date: {
		fontSize: 13,
		marginLeft: 4,
		...sharedStyles.textColorDescription,
		...sharedStyles.textRegular
	},
	updateAlert: {
		color: COLOR_PRIMARY,
		...sharedStyles.textSemibold
	},
	unreadNumberContainer: {
		minWidth: 21,
		height: 21,
		paddingVertical: 3,
		paddingHorizontal: 5,
		borderRadius: 10.5,
		backgroundColor: COLOR_UNREAD,
		alignItems: 'center',
		justifyContent: 'center',
		marginLeft: 10
	},
	unreadMentionedContainer: {
		backgroundColor: COLOR_PRIMARY
	},
	unreadText: {
		color: COLOR_TEXT,
		overflow: 'hidden',
		fontSize: 13,
		...sharedStyles.textMedium,
		letterSpacing: 0.56,
		textAlign: 'center'
	},
	unreadMentionedText: {
		color: COLOR_WHITE
	},
	status: {
		marginRight: 7,
		marginTop: 3
	},
	markdownText: {
		flex: 1,
		fontSize: 14,
		lineHeight: 17,
		...sharedStyles.textRegular,
		...sharedStyles.textColorDescription
	},
	markdownTextAlert: {
		...sharedStyles.textColorNormal
	},
	avatar: {
		marginRight: 10
	},
	upperContainer: {
		overflow: 'hidden'
	},
	actionsContainer: {
		position: 'absolute',
		left: 0,
		right: 0,
		height: ROW_HEIGHT
	},
	actionText: {
		color: COLOR_WHITE,
		fontSize: 15,
		backgroundColor: 'transparent',
		justifyContent: 'center',
		marginTop: 4,
		...sharedStyles.textSemibold
	},
	actionLeftButtonContainer: {
		position: 'absolute',
		height: ROW_HEIGHT,
		backgroundColor: COLOR_PRIMARY,
		justifyContent: 'center',
		top: 0
	},
	actionRightButtonContainer: {
		position: 'absolute',
		height: ROW_HEIGHT,
		justifyContent: 'center',
		top: 0,
		backgroundColor: '#54585e'
	},
	actionButton: {
		width: ACTION_WIDTH,
		height: '100%',
		alignItems: 'center',
		justifyContent: 'center'
	}
});
