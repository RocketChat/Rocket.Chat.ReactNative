import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	...sharedStyles,
	container: {
		flex: 1
	},
	reactionEmoji: {
		fontSize: 20,
		color: '#ffffff',
		marginRight: 5
	},
	reactionCustomEmoji: {
		width: 20,
		height: 20,
		marginRight: 5,
		marginTop: 5
	},
	tabsContainer: {
		borderBottomWidth: 0,
		justifyContent: 'flex-start'
	},
	tabView: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		minWidth: 50,
		padding: 10
	},
	userRow: {
		flexDirection: 'row',
		marginVertical: 10,
		alignContent: 'center',
		alignItems: 'center'
	},
	userTitle: {
		marginLeft: 10,
		fontSize: 15
	}
});