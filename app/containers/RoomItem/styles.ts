import { StyleSheet } from 'react-native';
import { ReduceMotion } from 'react-native-reanimated';

import sharedStyles from '~/views/Styles';

export const OPEN_RATIO = 0.375;
export const FULL_SWIPE_RATIO = 0.53;

export const getOpenWidth = (width: number) => {
	'worklet';
	return width * OPEN_RATIO;
};
export const getFullSwipeThreshold = (width: number) => {
	'worklet';
	return width * FULL_SWIPE_RATIO;
};

export const SWIPE_SPRING_CONFIG = {
	mass: 1,
	stiffness: 150,
	damping: 24.5,
	reduceMotion: ReduceMotion.System
};

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
		alignItems: 'flex-start'
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
	markdownText: {
		flex: 1,
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
		width: '100%',
		height: '100%',
		flexDirection: 'row',
		overflow: 'hidden'
	},
	actionButtonContentEnd: {
		justifyContent: 'flex-end'
	},
	actionIconSlot: {
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
