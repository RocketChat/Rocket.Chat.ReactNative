import { StyleSheet } from 'react-native';

import sharedStyles from '../../views/Styles';

export default StyleSheet.create({
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
		...sharedStyles.textAlignCenter,
		backgroundColor: 'transparent',
		color: '#ffffff'
	},
	customCategoryEmoji: {
		margin: 8
	},
	footerContainer: {
		height: 45,
		paddingHorizontal: 12,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center'
	},
	footerButtonsContainer: {
		height: 30,
		width: 30,
		justifyContent: 'center',
		alignItems: 'center'
	}
});
