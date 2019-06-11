import { StyleSheet } from 'react-native';

import { COLOR_WHITE, COLOR_SEPARATOR, COLOR_PRIMARY } from '../../constants/colors';
import { isIOS } from '../../utils/deviceInfo';
import sharedStyles from '../Styles';

export default StyleSheet.create({
	safeAreaView: {
		flex: 1,
		backgroundColor: isIOS ? '#F7F8FA' : '#E1E5E8'
	},
	list: {
		flex: 1
	},
	listContainer: {
		paddingBottom: 30
	},
	separator: {
		marginLeft: 60
	},
	toggleDropdownContainer: {
		height: 47,
		backgroundColor: COLOR_WHITE,
		flexDirection: 'row',
		alignItems: 'center'
	},
	toggleDropdownIcon: {
		color: COLOR_PRIMARY,
		marginLeft: 20,
		marginRight: 17
	},
	toggleDropdownText: {
		flex: 1,
		color: COLOR_PRIMARY,
		fontSize: 17,
		...sharedStyles.textRegular
	},
	toggleDropdownArrow: {
		...sharedStyles.textColorDescription,
		marginRight: 15
	},
	dropdownContainer: {
		backgroundColor: COLOR_WHITE,
		width: '100%',
		position: 'absolute',
		top: 0
	},
	backdrop: {
		...StyleSheet.absoluteFill,
		backgroundColor: '#000000'
	},
	dropdownContainerHeader: {
		height: 47,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderColor: COLOR_SEPARATOR,
		alignItems: 'center',
		backgroundColor: isIOS ? COLOR_WHITE : '#54585E',
		flexDirection: 'row'
	},
	dropdownItemButton: {
		height: 57,
		justifyContent: 'center'
	},
	dropdownItemContainer: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center'
	},
	dropdownItemText: {
		fontSize: 18,
		flex: 1,
		...sharedStyles.textColorNormal,
		...sharedStyles.textRegular
	},
	dropdownItemDescription: {
		fontSize: 14,
		flex: 1,
		marginTop: 2,
		...sharedStyles.textColorDescription,
		...sharedStyles.textRegular
	},
	dropdownToggleText: {
		fontSize: 15,
		flex: 1,
		marginLeft: 15,
		...sharedStyles.textColorDescription,
		...sharedStyles.textRegular
	},
	dropdownItemIcon: {
		width: 22,
		height: 22,
		marginHorizontal: 15,
		...sharedStyles.textColorDescription
	},
	dropdownSeparator: {
		height: StyleSheet.hairlineWidth,
		backgroundColor: COLOR_SEPARATOR,
		marginHorizontal: 15,
		flex: 1
	},
	directoryItemButton: {
		height: 54,
		backgroundColor: COLOR_WHITE
	},
	directoryItemContainer: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 15
	},
	directoryItemAvatar: {
		marginRight: 12
	},
	directoryItemTextTitle: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	directoryItemTextContainer: {
		flex: 1,
		flexDirection: 'column',
		justifyContent: 'center'
	},
	directoryItemName: {
		flex: 1,
		fontSize: 17,
		...sharedStyles.textMedium,
		...sharedStyles.textColorNormal
	},
	directoryItemUsername: {
		fontSize: 14,
		...sharedStyles.textRegular,
		...sharedStyles.textColorDescription
	},
	directoryItemLabel: {
		fontSize: 14,
		paddingLeft: 10,
		...sharedStyles.textRegular,
		...sharedStyles.textColorDescription
	},
	inverted: {
		transform: [{ scaleY: -1 }]
	},
	globalUsersContainer: {
		padding: 15
	},
	globalUsersTextContainer: {
		flex: 1,
		flexDirection: 'column'
	}
});
