import { StyleSheet } from 'react-native';

import { COLOR_WHITE } from '../../constants/colors';
import sharedStyles from '../../views/Styles';

export const ROW_HEIGHT = 54;

export default StyleSheet.create({
	directoryItemButton: {
		height: ROW_HEIGHT,
		backgroundColor: COLOR_WHITE
	},
	directoryItemContainer: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 15
	},
	directoryItemAvatar: {
		marginRight: 12
	},
	directoryItemTextTitle: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	directoryItemTextContainer: {
		flex: 1,
		flexDirection: 'column',
		justifyContent: 'center'
	},
	directoryItemName: {
		flex: 1,
		fontSize: 17,
		...sharedStyles.textMedium,
		...sharedStyles.textColorNormal
	},
	directoryItemUsername: {
		fontSize: 14,
		...sharedStyles.textRegular,
		...sharedStyles.textColorDescription
	},
	directoryItemLabel: {
		fontSize: 14,
		paddingLeft: 10,
		...sharedStyles.textRegular,
		...sharedStyles.textColorDescription
	}
});
