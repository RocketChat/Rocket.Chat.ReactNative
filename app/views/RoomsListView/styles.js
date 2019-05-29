import { StyleSheet } from 'react-native';
import { isIOS } from '../../utils/deviceInfo';
import {
	COLOR_SEPARATOR, COLOR_TEXT, COLOR_PRIMARY, COLOR_WHITE
} from '../../constants/colors';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: isIOS ? COLOR_WHITE : '#E1E5E8'
	},
	list: {
		width: '100%',
		backgroundColor: COLOR_WHITE
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
		backgroundColor: isIOS ? COLOR_WHITE : '#54585E',
		flexDirection: 'row'
	},
	sortToggleContainerClose: {
		position: 'absolute',
		top: 0,
		width: '100%'
	},
	sortToggleText: {
		fontSize: 15,
		flex: 1,
		marginLeft: 15,
		...sharedStyles.textColorDescription,
		...sharedStyles.textRegular
	},
	dropdownContainer: {
		backgroundColor: COLOR_WHITE,
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
		fontSize: 18,
		flex: 1,
		...sharedStyles.textColorNormal,
		...sharedStyles.textRegular
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
		...sharedStyles.textColorDescription
	},
	groupTitleContainer: {
		paddingHorizontal: 15,
		paddingTop: 17,
		paddingBottom: 10,
		backgroundColor: isIOS ? COLOR_WHITE : '#9ea2a8'
	},
	groupTitle: {
		color: isIOS ? COLOR_TEXT : '#54585E',
		fontSize: isIOS ? 22 : 15,
		letterSpacing: 0.27,
		flex: 1,
		lineHeight: isIOS ? 41 : 24,
		...sharedStyles.textBold
	},
	serverHeader: {
		justifyContent: 'space-between'
	},
	serverHeaderText: {
		fontSize: 15,
		marginLeft: 15,
		...sharedStyles.textColorDescription,
		...sharedStyles.textRegular
	},
	serverHeaderAdd: {
		color: isIOS ? COLOR_PRIMARY : COLOR_WHITE,
		fontSize: 15,
		marginRight: 15,
		paddingVertical: 10,
		...sharedStyles.textRegular
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
		fontSize: 18,
		...sharedStyles.textColorNormal,
		...sharedStyles.textSemibold
	},
	serverUrl: {
		fontSize: 15,
		...sharedStyles.textColorDescription,
		...sharedStyles.textRegular
	},
	checkIcon: {
		marginHorizontal: 15,
		color: COLOR_PRIMARY
	},
	serverSeparator: {
		height: StyleSheet.hairlineWidth,
		backgroundColor: COLOR_SEPARATOR,
		marginLeft: 72
	}
});
