import { StyleSheet } from 'react-native';
import sharedStyles from '../Styles';

export default StyleSheet.create({
	listEmptyContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center'
	},
	item: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'space-between'
	},
	separator: {
		height: StyleSheet.hairlineWidth
	},
	name: {
		...sharedStyles.textRegular,
		fontSize: 17
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
