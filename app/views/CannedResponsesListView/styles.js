import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	containerHeader: {
		height: 92,
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
		width: 200
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
		lineHeight: 20,
		paddingTop: 0,
		paddingBottom: 0,
		...sharedStyles.textMedium
	},
	cannedScope: {
		flex: 1,
		fontSize: 12,
		lineHeight: 16,
		paddingTop: 0,
		paddingBottom: 0,
		...sharedStyles.textRegular
	},
	cannedText: {
		marginTop: 8,
		fontSize: 14,
		lineHeight: 20,
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
		lineHeight: 16,
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
