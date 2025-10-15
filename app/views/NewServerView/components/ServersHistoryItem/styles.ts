import { StyleSheet } from 'react-native';

import sharedStyles from '../../../Styles';

export const ROW_HEIGHT = 56;
export const ACTION_WIDTH = 80;
export const SMALL_SWIPE = ACTION_WIDTH / 2;
export const LONG_SWIPE = ACTION_WIDTH * 2.5;

export default StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 12,
		minHeight: ROW_HEIGHT
	},
	serverIcon: {
		width: 44,
		height: 44,
		borderRadius: 4
	},
	textContainer: {
		flex: 1,
		flexDirection: 'column',
		justifyContent: 'center',
		paddingRight: 18,
		paddingLeft: 12
	},
	title: {
		fontSize: 18,
		...sharedStyles.textSemibold
	},
	subtitle: {
		fontSize: 16,
		...sharedStyles.textRegular
	},
	actionsLeftContainer: {
		flexDirection: 'row',
		position: 'absolute',
		left: 0,
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
	}
});
