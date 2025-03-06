import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	list: {
		flex: 1
	},
	listContainer: {
		paddingBottom: 30
	},
	filterItemButton: {
		height: 46,
		justifyContent: 'center'
	},
	filterItemContainer: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		paddingRight: 15
	},
	filterItemText: {
		fontSize: 18,
		flex: 1,
		...sharedStyles.textRegular
	},
	filterItemDescription: {
		fontSize: 14,
		flex: 1,
		marginTop: 2,
		...sharedStyles.textRegular
	},
	filterItemIcon: {
		width: 22,
		height: 22,
		marginHorizontal: 15
	},
	globalUsersContainer: {
		padding: 15
	},
	globalUsersTextContainer: {
		flex: 1,
		flexDirection: 'column'
	}
});
