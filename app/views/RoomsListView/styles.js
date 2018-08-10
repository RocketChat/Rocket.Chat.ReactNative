import { StyleSheet } from 'react-native';

export default StyleSheet.create({
	container: {
		flex: 1
	},
	separator: {
		height: StyleSheet.hairlineWidth,
		backgroundColor: '#E1E5E8',
		marginLeft: 78
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
	loading: {
		flex: 1
	},
	sortToggleContainer: {
		height: 41,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderColor: '#E1E5E8',
		alignItems: 'center',
		backgroundColor: '#fff',
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
	sortContainer: {
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
	sortBackdrop: {
		...StyleSheet.absoluteFill,
		backgroundColor: '#000000'
	},
	sortSeparator: {
		height: StyleSheet.hairlineWidth,
		backgroundColor: '#CBCED1',
		marginHorizontal: 15,
		flex: 1
	},
	sortIconLeft: {
		width: 50,
		paddingHorizontal: 15,
		resizeMode: 'contain',
		justifyContent: 'center'
	},
	groupTitleContainer: {
		paddingHorizontal: 15,
		paddingTop: 17,
		backgroundColor: '#fff'
	},
	groupTitle: {
		color: '#2F343D',
		fontSize: 22,
		fontWeight: 'bold',
		letterSpacing: 0.27,
		flex: 1,
		lineHeight: 41
	}
});
