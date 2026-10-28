import { StyleSheet } from 'react-native';

import sharedStyles from '~/views/Styles';

export default StyleSheet.create({
	flex: {
		flex: 1
	},
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		paddingHorizontal: 16
	},
	centerContainer: {
		flex: 1
	},
	title: {
		flex: 1,
		fontSize: 16,
		lineHeight: 20,
		...sharedStyles.textRegular
	},
	alert: {
		...sharedStyles.textBold
	},
	row: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: 4
	},
	wrapUpdatedAndBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8
	},
	titleContainer: {
		width: '100%',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center'
	},
	date: {
		fontSize: 12,
		lineHeight: 18,
		marginLeft: 4,
		...sharedStyles.textMedium
	},
	updateAlert: {
		...sharedStyles.textBold
	},
	status: {
		marginRight: 2
	},
	markdownText: {
		flex: 1,
		fontSize: 14,
		lineHeight: 20,
		...sharedStyles.textRegular
	},
	containerTopAligned: {
		alignItems: 'flex-start',
		paddingTop: 8
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
		left: 0
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
	}
});
