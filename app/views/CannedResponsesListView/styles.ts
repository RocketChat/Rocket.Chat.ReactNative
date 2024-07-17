import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	list: {
		flex: 1
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
		overflow: 'hidden'
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
		marginLeft: 8
	}
});
