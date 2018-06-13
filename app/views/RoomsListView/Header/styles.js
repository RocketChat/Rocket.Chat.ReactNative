import { StyleSheet, Platform, Dimensions } from 'react-native';

const TITLE_OFFSET = Platform.OS === 'ios' ? 46 : 46;
const { width } = Dimensions.get('window');
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
		justifyContent: 'flex-start',
		flexDirection: 'row',
		height: 44
	},
	status: {
		borderRadius: 10,
		width: 10,
		height: 10
	},
	avatar: {
		marginRight: 15
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
	modal: {
		width: width - 60,
		height: width - 60,
		backgroundColor: '#F7F7F7',
		borderRadius: 4,
		flexDirection: 'column'
	},
	modalButton: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: 'transparent',
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: 'rgba(0, 0, 0, .3)',
		paddingHorizontal: 20
	},
	user_status: {
		position: 'absolute',
		bottom: -2,
		right: -2,
		borderWidth: 2,
		borderColor: '#fff'
	},
	serverImage: {
		width: 24,
		height: 24,
		borderRadius: 4
	},
	inputSearch: {
		flex: 1,
		marginLeft: 44
	},
	rows: {
		flexGrow: 1,
		marginHorizontal: 5
	},
	status_text: {
		fontSize: 10,
		color: '#888'
	}
});
