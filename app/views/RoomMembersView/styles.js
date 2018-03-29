import { StyleSheet } from 'react-native';

export default StyleSheet.create({
	list: {
		flex: 1,
		backgroundColor: '#ffffff'
	},
	item: {
		flexDirection: 'row',
		paddingVertical: 10,
		paddingHorizontal: 16,
		alignItems: 'center'
	},
	avatar: {
		marginRight: 16
	},
	status: {
		bottom: -2,
		right: -2,
		borderWidth: 2,
		borderRadius: 10,
		width: 10,
		height: 10
	},
	separator: {
		height: StyleSheet.hairlineWidth,
		backgroundColor: '#ddd'
	},
	username: {
		flex: 1,
		fontSize: 16,
		color: '#444'
	},
	headerButtonTouchable: {
		borderRadius: 4
	},
	headerButton: {
		padding: 6,
		backgroundColor: 'transparent',
		alignItems: 'center',
		justifyContent: 'center'
	},
	headerButtonText: {
		color: '#292E35'
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
	}
});
