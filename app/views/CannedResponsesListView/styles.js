import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	list: {
		flex: 1
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
	containerHeader: {
		paddingTop: 12,
		paddingHorizontal: 16,
		paddingBottom: 8
	},
	containerRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 16,
		justifyContent: 'space-between'
	},
	label: {
		marginBottom: 10,
		fontSize: 14,
		...sharedStyles.textSemibold
	},
	selectDepartment: {
		width: 136,
		height: 40,
		borderWidth: 2,
		minHeight: 0
	},
	searchBox: {
		alignItems: 'center',
		flexDirection: 'row',
		fontSize: 17,
		height: 40,
		paddingHorizontal: 16,
		borderWidth: 2,
		flex: 1,
		marginRight: 8
	},
	inputSearch: {
		flex: 1,
		fontSize: 17,
		marginLeft: 8,
		paddingTop: 0,
		paddingBottom: 0,
		...sharedStyles.textRegular
	},
	wrapCannedItem: {
		minHeight: 117,
		maxHeight: 141,
		padding: 16
	},
	cannedRow: {
		flexDirection: 'row',
		height: 36
	},
	cannedWrapShortcutScope: {
		flex: 1
	},
	cannedShortcut: {
		flex: 1,
		fontSize: 14,
		paddingTop: 0,
		paddingBottom: 0,
		...sharedStyles.textMedium
	},
	cannedScope: {
		flex: 1,
		fontSize: 12,
		paddingTop: 0,
		paddingBottom: 0,
		...sharedStyles.textRegular
	},
	cannedText: {
		marginTop: 8,
		fontSize: 14,
		paddingTop: 0,
		paddingBottom: 0,
		...sharedStyles.textRegular
	},
	cannedTagContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap'
	},
	cannedTagWrap: {
		borderRadius: 4,
		marginRight: 4,
		marginTop: 8,
		height: 16
	},
	cannedTag: {
		fontSize: 12,
		paddingTop: 0,
		paddingBottom: 0,
		paddingHorizontal: 4,
		...sharedStyles.textRegular
	},
	cannedUseButton: {
		height: 28,
		width: 56,
		marginRight: 32,
		marginLeft: 8
	}
});
