import { StyleSheet } from 'react-native';

export default StyleSheet.create({
	list: {
		flex: 1,
		backgroundColor: '#ffffff'
	},
	listEmptyContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#ffffff'
	},
	item: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'space-between'
	},
	separator: {
		height: StyleSheet.hairlineWidth,
		backgroundColor: '#E1E5E8'
	},
	name: {
		fontSize: 20,
		color: '#000'
	},
	username: {
		flex: 1,
		fontSize: 16,
		color: '#444'
	},
	itemContainer: {
		flex: 1,
		padding: 8
	}
});
