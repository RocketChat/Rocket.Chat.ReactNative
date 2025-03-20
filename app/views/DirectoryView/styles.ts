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
		paddingVertical: 12,
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
