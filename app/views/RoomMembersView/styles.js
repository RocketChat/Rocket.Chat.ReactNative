import { StyleSheet } from 'react-native';

export default StyleSheet.create({
	list: {
		flex: 1,
		backgroundColor: '#ffffff'
	},
	item: {
		flexDirection: 'row',
		paddingVertical: 8,
		paddingHorizontal: 16,
		alignItems: 'center'
	},
	avatar: {
		marginRight: 16
	},
	status: {
		position: 'absolute',
		bottom: -3,
		right: -3,
		borderWidth: 2,
		borderColor: '#fff',
		borderRadius: 12,
		width: 12,
		height: 12
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
