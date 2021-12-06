import { StyleSheet } from 'react-native';

export default StyleSheet.create({
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
	textBold: {
		fontWeight: 'bold'
	}
});
