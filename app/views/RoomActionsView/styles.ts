import { I18nManager, StyleSheet } from 'react-native';

import { PADDING_HORIZONTAL } from '../../containers/List/constants';
import sharedStyles from '../Styles';

export default StyleSheet.create({
	roomInfoContainer: {
		paddingHorizontal: PADDING_HORIZONTAL,
		flexDirection: 'row',
		alignItems: 'center'
	},
	avatar: {
		marginRight: PADDING_HORIZONTAL
	},
	roomTitleContainer: {
		flex: 1
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
	},
	actionIndicator: {
		...(I18nManager.isRTL ? { transform: [{ rotate: '180deg' }] } : {})
	}
});
