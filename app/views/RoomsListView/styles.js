import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	container: {
		flex: 1
	},
	list: {
		width: '100%'
	},
	dropdownContainerHeader: {
		height: 41,
		borderBottomWidth: StyleSheet.hairlineWidth,
		alignItems: 'center',
		flexDirection: 'row'
	},
	sortToggleContainerClose: {
		position: 'absolute',
		top: 0,
		width: '100%'
	},
	sortToggleText: {
		fontSize: 16,
		flex: 1,
		...sharedStyles.textRegular
	},
	queueToggleText: {
		fontSize: 16,
		flex: 1,
		...sharedStyles.textRegular
	},
	dropdownContainer: {
		width: '100%',
		position: 'absolute',
		top: 0,
		borderBottomWidth: StyleSheet.hairlineWidth
	},
	backdrop: {
		...StyleSheet.absoluteFill
	},
	sortSeparator: {
		height: StyleSheet.hairlineWidth,
		marginHorizontal: 12,
		flex: 1
	},
	sortIcon: {
		marginHorizontal: 12
	},
	queueIcon: {
		marginHorizontal: 12
	},
	groupTitleContainer: {
		paddingHorizontal: 12,
		paddingTop: 17,
		paddingBottom: 10
	},
	groupTitle: {
		fontSize: 16,
		letterSpacing: 0.27,
		flex: 1,
		lineHeight: 24,
		...sharedStyles.textBold
	},
	serverHeader: {
		justifyContent: 'space-between'
	},
	serverHeaderText: {
		fontSize: 16,
		marginLeft: 12,
		...sharedStyles.textRegular
	},
	serverHeaderAdd: {
		fontSize: 16,
		marginRight: 12,
		paddingVertical: 10,
		...sharedStyles.textRegular
	},
	serverItem: {
		height: 68
	},
	serverItemContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		height: 68
	},
	serverIcon: {
		width: 42,
		height: 42,
		marginHorizontal: 12,
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
		...sharedStyles.textSemibold
	},
	serverUrl: {
		fontSize: 16,
		...sharedStyles.textRegular
	},
	serverSeparator: {
		height: StyleSheet.hairlineWidth,
		marginLeft: 72
	},
	encryptionButton: {
		width: '100%',
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 12
	},
	encryptionText: {
		flex: 1,
		fontSize: 16,
		...sharedStyles.textMedium
	},
	omnichannelToggle: {
		marginRight: 12
	}
});
