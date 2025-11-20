import { I18nManager } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import sharedStyles from '../../../../views/Styles';

export default StyleSheet.create({
	queueIcon: {
		marginHorizontal: 10
	},
	omnichannelRightContainer: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	titleOmnichannelQueue: {
		...sharedStyles.textMedium
	},
	emptyText: {
		...sharedStyles.textRegular,
		fontSize: 12
	},
	actionIndicator: {
		...(I18nManager.isRTL ? { transform: [{ rotate: '180deg' }] } : {})
	}
});
