import { StyleSheet, I18nManager } from 'react-native';

import {
	COLOR_SEPARATOR, COLOR_WHITE, COLOR_BORDER
} from '../../constants/colors';
import sharedStyles from '../Styles';

export default StyleSheet.create({
	contentContainer: {
		paddingBottom: 30
	},
	container: {
		flex: 1,
		backgroundColor: '#F6F7F9'
	},
	sectionItemTitle: {
		alignSelf: 'flex-start',
		fontSize: 14,
		marginStart: 20,
		...sharedStyles.textColorNormal,
		...sharedStyles.textRegular
	},
	sectionItemSubTitle: {
		alignSelf: 'flex-start',
		fontSize: 11,
		marginStart: 20,
		...sharedStyles.textColorNormal,
		...sharedStyles.textRegular
	},
	sectionItem: {
		backgroundColor: COLOR_WHITE,
		paddingVertical: 16,
		flexDirection: 'row',
		alignItems: 'center'
	},
	sectionItemDisabled: {
		opacity: 0.3
	},
	separator: {
		height: StyleSheet.hairlineWidth,
		backgroundColor: COLOR_SEPARATOR
	},
	sectionSeparatorBorder: {
		borderColor: COLOR_BORDER,
		borderTopWidth: 10
	},
	iconStyle: {
		transform: [{ rotate: I18nManager.isRTL ? '90deg' : '270deg' }],
		alignSelf: 'baseline',
		marginEnd: 20
	}
});
