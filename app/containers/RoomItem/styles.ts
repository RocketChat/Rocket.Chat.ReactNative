import { StyleSheet } from 'react-native';

import sharedStyles from '../../views/Styles';

export const ACTION_WIDTH = 80;
export const SMALL_SWIPE = ACTION_WIDTH / 2;
export const LONG_SWIPE = ACTION_WIDTH * 2.5;

export default StyleSheet.create({
	flex: {
		flex: 1
	},
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingLeft: 14
	},
	centerContainer: {
		flex: 1,
		minWidth: 0,
		paddingVertical: 10,
		paddingRight: 14,
		borderBottomWidth: StyleSheet.hairlineWidth
	},
	title: {
		flex: 1,
		fontSize: 17,
		...sharedStyles.textMedium
	},
	alert: {
		...sharedStyles.textSemibold
	},
	row: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'flex-start',
		minWidth: 0
	},
	wrapUpdatedAndBadge: {
		alignItems: 'flex-end'
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
		marginRight: 2
	},
	lastMessageContainer: {
		flex: 1,
		flexShrink: 1,
		minWidth: 0,
		marginRight: 4
	},
	markdownText: {
		width: '100%',
		flexShrink: 1,
		fontSize: 14,
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
		right: 0
	},
	actionsLeftContainer: {
		flexDirection: 'row',
		position: 'absolute',
		left: 0,
		right: 0
	},
	actionLeftButtonContainer: {
		position: 'absolute',
		justifyContent: 'center',
		top: 0,
		right: 0
	},
	actionRightButtonContainer: {
		position: 'absolute',
		justifyContent: 'center',
		top: 0
	},
	actionButton: {
		width: ACTION_WIDTH,
		height: '100%',
		alignItems: 'center',
		justifyContent: 'center'
	},
	tagContainer: {
		alignSelf: 'center',
		alignItems: 'center',
		borderRadius: 4,
		marginHorizontal: 4
	},
	tagText: {
		fontSize: 13,
		paddingHorizontal: 4,
		...sharedStyles.textSemibold
	},
	typeIcon: {
		justifyContent: 'center'
	}
});
