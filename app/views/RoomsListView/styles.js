import { StyleSheet } from 'react-native';

export default StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'stretch',
		justifyContent: 'center'
	},
	separator: {
		height: 1,
		backgroundColor: '#E7E7E7'
	},
	list: {
		width: '100%',
		backgroundColor: '#FFFFFF'
	},
	emptyView: {
		flexGrow: 1,
		alignItems: 'stretch',
		justifyContent: 'center'
	},
	emptyText: {
		textAlign: 'center',
		fontSize: 18,
		color: '#ccc'
	},
	actionButtonIcon: {
		fontSize: 20,
		height: 22,
		color: 'white'
	},
	searchBoxView: {
		backgroundColor: '#eee'
	},
	searchBox: {
		backgroundColor: '#fff',
		margin: 5,
		borderRadius: 5,
		padding: 5,
		paddingLeft: 10,
		color: '#aaa'
	},
	safeAreaView: {
		flex: 1,
		backgroundColor: '#fff'
	}
});
