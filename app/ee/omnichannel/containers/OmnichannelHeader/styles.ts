import { StyleSheet } from 'react-native';

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
	}
});
