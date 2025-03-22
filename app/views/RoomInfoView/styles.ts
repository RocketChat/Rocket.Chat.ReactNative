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
		minHeight: 320,
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 20,
		paddingBottom: 8,
		paddingTop: 32
	},
	avatar: {
		marginHorizontal: 10
	},
	roomTitleContainer: {
		paddingTop: 16,
		marginHorizontal: 16,
		alignItems: 'center',
		flexDirection: 'row'
	},
	roomTitle: {
		fontSize: 16,
		...sharedStyles.textAlignCenter,
		...sharedStyles.textMedium
	},
	roomUsername: {
		fontSize: 14,
		...sharedStyles.textAlignCenter,
		...sharedStyles.textRegular
	},
	roomTitleRow: {
		flexDirection: 'row',
		alignItems: 'center'
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
		borderRadius: 4,
		marginRight: 6,
		marginBottom: 6
	},
	role: {
		fontSize: 14,
		...sharedStyles.textRegular
	},
	roomButtonsContainer: {
		flexDirection: 'row',
		paddingTop: 16
	},
	roomButton: {
		alignItems: 'center',
		marginHorizontal: 4,
		justifyContent: 'space-between',
		width: 80
	},
	roomButtonText: {
		marginTop: 4
	},
	roomInfoViewTitleContainer: {
		paddingTop: 16,
		paddingHorizontal: 20,
		alignItems: 'center'
	}
});
