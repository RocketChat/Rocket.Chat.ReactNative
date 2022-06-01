import { StyleSheet } from 'react-native';

import { fontSize } from '../../lib/theme';
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
		paddingVertical: 8
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
		fontSize: fontSize[16],
		...sharedStyles.textAlignCenter,
		...sharedStyles.textMedium
	},
	roomUsername: {
		fontSize: fontSize[16],
		...sharedStyles.textAlignCenter,
		...sharedStyles.textRegular
	},
	roomTitleRow: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	itemLabel: {
		marginBottom: 10,
		fontSize: fontSize[14],
		...sharedStyles.textMedium
	},
	itemContent: {
		fontSize: fontSize[14],
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
		fontSize: fontSize[14],
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
