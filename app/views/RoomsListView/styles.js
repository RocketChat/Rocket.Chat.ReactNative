import { StyleSheet } from 'react-native';
import { isIOS } from '../../utils/deviceInfo';
import { COLOR_SEPARATOR } from '../../constants/colors';

export default StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: isIOS ? '#FFF' : '#E1E5E8'
	},
	separator: {
		height: StyleSheet.hairlineWidth,
		backgroundColor: COLOR_SEPARATOR,
		marginLeft: 73
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
	loading: {
		flex: 1
	},
	dropdownContainerHeader: {
		height: 41,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderColor: COLOR_SEPARATOR,
		alignItems: 'center',
		backgroundColor: isIOS ? '#fff' : '#54585E',
		flexDirection: 'row'
	},
	sortToggleContainerClose: {
		position: 'absolute',
		top: 0,
		width: '100%'
	},
	sortToggleText: {
		color: '#9EA2A8',
		fontSize: 15,
		fontWeight: 'normal',
		flex: 1,
		marginLeft: 15
	},
	dropdownContainer: {
		backgroundColor: '#fff',
		width: '100%',
		position: 'absolute',
		top: 0
	},
	sortItemButton: {
		height: 57,
		justifyContent: 'center'
	},
	sortItemContainer: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	sortItemText: {
		color: '#54585E',
		fontSize: 18,
		fontWeight: 'normal',
		flex: 1
	},
	backdrop: {
		...StyleSheet.absoluteFill,
		backgroundColor: '#000000'
	},
	sortSeparator: {
		height: StyleSheet.hairlineWidth,
		backgroundColor: COLOR_SEPARATOR,
		marginHorizontal: 15,
		flex: 1
	},
	sortIcon: {
		width: 22,
		height: 22,
		marginHorizontal: 15,
		// resizeMode: 'contain',
		// justifyContent: 'center',
		color: '#9ea2a8'
	},
	groupTitleContainer: {
		paddingHorizontal: 15,
		paddingTop: 17,
		paddingBottom: 10,
		backgroundColor: isIOS ? '#fff' : '#E1E5E8'
	},
	groupTitle: {
		color: isIOS ? '#2F343D' : '#54585E',
		fontSize: isIOS ? 22 : 15,
		fontWeight: 'bold',
		letterSpacing: 0.27,
		flex: 1,
		lineHeight: isIOS ? 41 : 24
	},
	serverHeader: {
		justifyContent: 'space-between'
	},
	serverHeaderText: {
		color: '#9EA2A8',
		fontSize: 15,
		fontWeight: 'normal',
		marginLeft: 15
	},
	serverHeaderAdd: {
		color: isIOS ? '#1D74F5' : '#FFF',
		fontSize: 15,
		fontWeight: 'normal',
		marginRight: 15,
		paddingVertical: 10
	},
	serverItem: {
		height: 68
	},
	serverItemContainer: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	serverIcon: {
		width: 42,
		height: 42,
		marginHorizontal: 15,
		marginVertical: 13,
		borderRadius: 4,
		resizeMode: 'contain'
	},
	serverTextContainer: {
		flex: 1,
		flexDirection: 'column',
		justifyContent: 'center'
	},
	serverName: {
		fontSize: 18, fontWeight: '600', color: '#0C0D0F'
	},
	serverUrl: {
		fontSize: 15,
		color: '#9EA2A8'
	},
	checkIcon: {
		marginHorizontal: 15,
		color: '#1d74f5'
	},
	serverSeparator: {
		height: StyleSheet.hairlineWidth,
		backgroundColor: COLOR_SEPARATOR,
		marginLeft: 72
	}
});
