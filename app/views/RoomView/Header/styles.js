import { StyleSheet, Platform } from 'react-native';

const TITLE_OFFSET = Platform.OS === 'ios' ? 70 : 56;
export default StyleSheet.create({
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1
	},
	titleContainer: {
		left: TITLE_OFFSET,
		right: TITLE_OFFSET,
		position: 'absolute',
		alignItems: 'center',
		justifyContent: Platform.OS === 'ios' ? 'center' : 'flex-start',
		flexDirection: 'row',
		height: 44
	},
	status: {
		borderRadius: 4,
		width: 8,
		height: 8,
		marginRight: 10
	},
	userStatus: {
		fontSize: 10,
		color: '#888'
	},
	title: {
		fontWeight: '500',
		color: '#292E35'
	},
	left: {
		left: 0,
		position: 'absolute'
	},
	right: {
		right: 0,
		position: 'absolute',
		flexDirection: 'row'
	},
	headerButton: {
		backgroundColor: 'transparent',
		height: 44,
		width: 44,
		alignItems: 'center',
		justifyContent: 'center'
	}
});
