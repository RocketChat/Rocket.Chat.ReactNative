import { StyleSheet, PixelRatio } from 'react-native';

import sharedStyles from '../../views/Styles';
import {
	COLOR_SEPARATOR, COLOR_PRIMARY, COLOR_WHITE, COLOR_TEXT
} from '../../constants/colors';

export const ROW_HEIGHT = 75 * PixelRatio.getFontScale();

export default StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		marginLeft: 14,
		height: ROW_HEIGHT
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
		minWidth: 22,
		height: 22,
		paddingVertical: 3,
		paddingHorizontal: 5,
		borderRadius: 14,
		backgroundColor: COLOR_TEXT,
		alignItems: 'center',
		justifyContent: 'center',
		marginLeft: 10
	},
	unreadMentioned: {
		backgroundColor: COLOR_PRIMARY
	},
	unreadNumberText: {
		color: COLOR_WHITE,
		overflow: 'hidden',
		fontSize: 13,
		...sharedStyles.textRegular,
		letterSpacing: 0.56,
		textAlign: 'center'
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
	}
});
