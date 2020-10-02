import { StyleSheet } from 'react-native';
import { PADDING_HORIZONTAL } from '../../containers/List/constants';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	contentContainer: {
		paddingBottom: 30
	},
	container: {
		flex: 1
	},
	sectionItem: {
		paddingHorizontal: PADDING_HORIZONTAL,
		height: 72,
		flexDirection: 'row',
		alignItems: 'center'
	},
	sectionItemIcon: {
		width: 56,
		textAlign: 'center'
	},
	sectionItemName: {
		flex: 1,
		fontSize: 14,
		...sharedStyles.textRegular
	},
	sectionItemDescription: {
		fontSize: 14,
		...sharedStyles.textRegular
	},
	separator: {
		height: StyleSheet.hairlineWidth
	},
	sectionSeparator: {
		borderBottomWidth: StyleSheet.hairlineWidth,
		height: 36
	},
	sectionSeparatorBorder: {
		borderTopWidth: StyleSheet.hairlineWidth
	},
	avatar: {
		marginRight: PADDING_HORIZONTAL
	},
	roomTitleContainer: {
		flex: 1
	},
	roomTitlePadding: {
		paddingRight: 16
	},
	roomTitle: {
		fontSize: 16,
		...sharedStyles.textMedium
	},
	roomDescription: {
		fontSize: 13,
		...sharedStyles.textRegular
	},
	roomTitleRow: {
		paddingRight: 16,
		flexDirection: 'row',
		alignItems: 'center'
	}
});
