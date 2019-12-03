import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	safeAreaView: {
		flex: 1
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
		height: 46,
		flexDirection: 'row',
		alignItems: 'center'
	},
	toggleDropdownIcon: {
		marginLeft: 20,
		marginRight: 17
	},
	toggleDropdownText: {
		flex: 1,
		fontSize: 17,
		...sharedStyles.textRegular
	},
	toggleDropdownArrow: {
		marginRight: 15
	},
	dropdownContainer: {
		width: '100%',
		position: 'absolute',
		top: 0
	},
	backdrop: {
		...StyleSheet.absoluteFill
	},
	dropdownContainerHeader: {
		height: 46,
		borderBottomWidth: StyleSheet.hairlineWidth,
		alignItems: 'center',
		flexDirection: 'row'
	},
	dropdownItemButton: {
		height: 46,
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
		...sharedStyles.textRegular
	},
	dropdownItemDescription: {
		fontSize: 14,
		flex: 1,
		marginTop: 2,
		...sharedStyles.textRegular
	},
	dropdownToggleText: {
		fontSize: 15,
		flex: 1,
		marginLeft: 15,
		...sharedStyles.textRegular
	},
	dropdownItemIcon: {
		width: 22,
		height: 22,
		marginHorizontal: 15
	},
	dropdownSeparator: {
		height: StyleSheet.hairlineWidth,
		marginHorizontal: 15,
		flex: 1
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
