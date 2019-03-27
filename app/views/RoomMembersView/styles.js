import { StyleSheet } from 'react-native';
import { COLOR_SEPARATOR } from '../../constants/colors';

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
		borderRadius: 12,
		width: 12,
		height: 12
	},
	separator: {
		height: StyleSheet.hairlineWidth,
		backgroundColor: COLOR_SEPARATOR,
		marginLeft: 60
	},
	username: {
		flex: 1,
		fontSize: 16,
		color: '#444'
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
	headerButton: {
		marginRight: 9,
		alignItems: 'flex-end'
	},
	loading: {
		flex: 1
	}
});
