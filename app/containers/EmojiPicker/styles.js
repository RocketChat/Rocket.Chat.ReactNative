import { StyleSheet } from 'react-native';
import { COLOR_PRIMARY, COLOR_WHITE } from '../../constants/colors';

export default StyleSheet.create({
	background: {
		backgroundColor: COLOR_WHITE
	},
	container: {
		flex: 1
	},
	tabsContainer: {
		height: 45,
		flexDirection: 'row',
		paddingTop: 5
	},
	tab: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingBottom: 10
	},
	tabEmoji: {
		fontSize: 20,
		color: 'black'
	},
	activeTabLine: {
		position: 'absolute',
		left: 0,
		right: 0,
		height: 2,
		backgroundColor: COLOR_PRIMARY,
		bottom: 0
	},
	tabLine: {
		position: 'absolute',
		left: 0,
		right: 0,
		height: 2,
		backgroundColor: 'rgba(0,0,0,0.05)',
		bottom: 0
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
