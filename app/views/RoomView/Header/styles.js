import { StyleSheet } from 'react-native';

export default StyleSheet.create({
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		flex: 1
	},
	titleTextContainer: {
		flexDirection: 'column',
		justifyContent: 'flex-start',
		flex: 1
	},
	status: {
		borderRadius: 10,
		width: 10,
		height: 10,
		position: 'absolute',
		borderWidth: 2,
		borderColor: '#fff',
		bottom: -2,
		right: -2
	},
	userStatus: {
		fontSize: 10,
		color: '#888'
	},
	title: {
		fontWeight: '500',
		color: '#292E35'
	},
	right: {
		flexDirection: 'row'
	},
	avatar: {
		marginRight: 5
	}
});
