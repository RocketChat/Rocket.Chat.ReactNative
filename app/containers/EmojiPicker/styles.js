import { StyleSheet } from 'react-native';
import { COLOR_PRIMARY, COLOR_WHITE } from '../../constants/colors';

export default StyleSheet.create({
	background: {
		backgroundColor: COLOR_WHITE
	},
	indicator: {
		backgroundColor: COLOR_PRIMARY
	},
	container: {
		flex: 1
	},
	tab: {
		margin: 0,
		padding: 0
	},
	tabBar: {
		backgroundColor: COLOR_WHITE
	},
	tabEmoji: {
		fontSize: 20,
		color: 'black'
	},
	categoryContainer: {
		flex: 1,
		alignItems: 'flex-start'
	},
	categoryInner: {
		flexWrap: 'wrap',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-start',
		flex: 1
	},
	categoryEmoji: {
		color: 'black',
		backgroundColor: 'transparent',
		textAlign: 'center'
	},
	customCategoryEmoji: {
		margin: 4
	}
});
