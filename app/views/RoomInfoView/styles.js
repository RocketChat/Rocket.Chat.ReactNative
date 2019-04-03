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
	roomTitle: {
		fontSize: 18,
		...sharedStyles.textColorNormal,
		...sharedStyles.textMedium
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
