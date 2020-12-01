import { StyleSheet, PixelRatio } from 'react-native';

import sharedStyles from '../../views/Styles';

export const ROW_HEIGHT = 75 * PixelRatio.getFontScale();
export const ACTION_WIDTH = 80;
export const SMALL_SWIPE = ACTION_WIDTH / 2;
export const LONG_SWIPE = ACTION_WIDTH * 3;

export default StyleSheet.create({
	flex: {
		flex: 1
	},
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingLeft: 14,
		height: ROW_HEIGHT
	},
	centerContainer: {
		flex: 1,
		paddingVertical: 10,
		paddingRight: 14,
		borderBottomWidth: StyleSheet.hairlineWidth
	},
	title: {
		flex: 1,
		fontSize: 17,
		lineHeight: 20,
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
		...sharedStyles.textRegular
	},
	updateAlert: {
		...sharedStyles.textSemibold
	},
	status: {
		marginLeft: 4,
		marginRight: 7,
		marginTop: 3
	},
	markdownText: {
		flex: 1,
		fontSize: 14,
		lineHeight: 17,
		...sharedStyles.textRegular
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
		fontSize: 15,
		justifyContent: 'center',
		marginTop: 4,
		...sharedStyles.textSemibold
	},
	actionLeftButtonContainer: {
		position: 'absolute',
		height: ROW_HEIGHT,
		justifyContent: 'center',
		top: 0,
		right: 0
	},
	actionRightButtonContainer: {
		position: 'absolute',
		height: ROW_HEIGHT,
		justifyContent: 'center',
		top: 0
	},
	actionButton: {
		width: ACTION_WIDTH,
		height: '100%',
		alignItems: 'center',
		justifyContent: 'center'
	}
});
