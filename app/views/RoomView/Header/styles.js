import { StyleSheet, Platform } from 'react-native';

export default StyleSheet.create({
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1
	},
	titleContainer: {
		alignItems: 'center',
		justifyContent: 'flex-start',
		flexDirection: 'row',
		flex: 1,
		marginLeft: Platform.OS === 'ios' ? 18 : 0,
		height: 44
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
	headerButton: {
		backgroundColor: 'transparent',
		height: 44,
		width: 40,
		alignItems: 'center',
		justifyContent: 'center'
	},
	avatar: {
		marginRight: 5
	}
});
