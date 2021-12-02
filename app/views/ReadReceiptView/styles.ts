import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	listEmptyContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center'
	},
	emptyText: {
		fontSize: 16,
		...sharedStyles.textRegular
	},
	item: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between'
	},
	separator: {
		height: StyleSheet.hairlineWidth
	},
	name: {
		...sharedStyles.textRegular,
		fontSize: 17
	},
	username: {
		...sharedStyles.textMedium,
		fontSize: 14
	},
	time: {
		...sharedStyles.textRegular,
		fontSize: 12
	},
	infoContainer: {
		flex: 1,
		marginLeft: 10
	},
	itemContainer: {
		flex: 1,
		flexDirection: 'row',
		padding: 10
	},
	list: {
		...sharedStyles.separatorVertical
	}
});
