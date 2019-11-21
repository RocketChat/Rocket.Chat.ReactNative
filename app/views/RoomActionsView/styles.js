import { StyleSheet } from 'react-native';
import { COLOR_DANGER } from '../../constants/colors';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	contentContainer: {
		paddingBottom: 30
	},
	container: {
		flex: 1
	},
	sectionItem: {
		paddingVertical: 16,
		flexDirection: 'row',
		alignItems: 'center'
	},
	sectionItemDisabled: {
		opacity: 0.3
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
		borderBottomWidth: 1,
		height: 10
	},
	sectionSeparatorBorder: {
		borderTopWidth: 1
	},
	textColorDanger: {
		color: COLOR_DANGER
	},
	avatar: {
		marginHorizontal: 16
	},
	roomTitleContainer: {
		flex: 1
	},
	roomTitle: {
		flex: 1,
		fontSize: 16,
		...sharedStyles.textMedium
	},
	roomDescription: {
		fontSize: 13,
		...sharedStyles.textRegular
	},
	roomTitleRow: {
		flexDirection: 'row',
		alignItems: 'center'
	}
});
