import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	container: {
		flex: 1
	},
	scroll: {
		flex: 1,
		flexDirection: 'column'
	},
	item: {
		paddingVertical: 10,
		paddingHorizontal: 20,
		justifyContent: 'center'
	},
	avatarContainer: {
		minHeight: 240,
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 20
	},
	avatarContainerDirectRoom: {
		paddingVertical: 16,
		minHeight: 320
	},
	avatar: {
		marginHorizontal: 10
	},
	roomTitleContainer: {
		paddingTop: 20,
		marginHorizontal: 16,
		alignItems: 'center'
	},
	roomTitle: {
		fontSize: 20,
		...sharedStyles.textAlignCenter,
		...sharedStyles.textMedium
	},
	roomUsername: {
		fontSize: 18,
		...sharedStyles.textAlignCenter,
		...sharedStyles.textRegular
	},
	roomTitleRow: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	status: {
		borderWidth: 4,
		bottom: -4,
		right: -4
	},
	itemLabel: {
		marginBottom: 10,
		fontSize: 14,
		...sharedStyles.textMedium
	},
	itemContent: {
		fontSize: 14,
		...sharedStyles.textRegular
	},
	itemContent__empty: {
		fontStyle: 'italic'
	},
	rolesContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap'
	},
	roleBadge: {
		padding: 6,
		borderRadius: 2,
		marginRight: 6,
		marginBottom: 6
	},
	role: {
		fontSize: 14,
		...sharedStyles.textRegular
	},
	roomButtonsContainer: {
		flexDirection: 'row',
		paddingTop: 30
	},
	roomButton: {
		alignItems: 'center',
		paddingHorizontal: 20,
		justifyContent: 'space-between'
	},
	roomButtonText: {
		marginTop: 5
	}
});
