import { StyleSheet } from 'react-native';

import { PADDING_HORIZONTAL } from '~/containers/List/constants';
import { isIOS } from '~/lib/methods/helpers/deviceInfo';
import sharedStyles from '../Styles';

export default StyleSheet.create({
	roomInfoContainer: {
		paddingHorizontal: PADDING_HORIZONTAL,
		paddingVertical: isIOS ? 12 : 4,
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
	}
});
