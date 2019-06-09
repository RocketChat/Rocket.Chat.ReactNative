import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';
import { COLOR_BACKGROUND_CONTAINER, COLOR_WHITE } from '../../constants/colors';

export default StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: COLOR_WHITE
	},
	scroll: {
		flex: 1,
		flexDirection: 'column',
		backgroundColor: COLOR_WHITE,
		padding: 10
	},
	item: {
		padding: 10,
		justifyContent: 'center'
	},
	avatarContainer: {
		height: 250,
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center'
	},
	avatar: {
		marginHorizontal: 10
	},
	roomTitleContainer: {
		paddingTop: 20,
		flexDirection: 'row'
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		padding: 16
	},
	roomTitle: {
		fontSize: 18,
		...sharedStyles.textColorNormal,
		...sharedStyles.textMedium
	},
	followContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center'
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
	followLabel: {
		padding: 10,
		fontSize: 12,
		...sharedStyles.textColorNormal,
		...sharedStyles.textMedium
	},
	followingContainer: {
		borderColor: '#f5f5f5',
		borderWidth: 1,
		borderRadius: 2,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginLeft: 10
	},
	followersContainer: {
		marginRight: 10,
		borderColor: '#f5f5f5',
		borderWidth: 1,
		borderRadius: 2,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center'
	},
	followContent: {
		padding: 10,
		fontSize: 20,
		// marginRight: 40,
		...sharedStyles.textColorNormal,
		...sharedStyles.textMedium

	},
	itemLabel: {
		marginBottom: 10,
		marginTop: 10,
		fontSize: 14,
		...sharedStyles.textColorNormal,
		...sharedStyles.textMedium
	},
	itemContent: {
		fontSize: 14,
		...sharedStyles.textColorDescription,
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
		backgroundColor: COLOR_BACKGROUND_CONTAINER,
		borderRadius: 2,
		marginRight: 6,
		marginBottom: 6
	},
	role: {
		fontSize: 14,
		...sharedStyles.textColorNormal,
		...sharedStyles.textRegular
	}
});
