import { StyleSheet } from 'react-native';

import sharedStyles from '../../views/Styles';
import { COLOR_WHITE } from '../../constants/colors';

export const ROW_HEIGHT = 56;

export default StyleSheet.create({
	serverItem: {
		height: ROW_HEIGHT,
		backgroundColor: COLOR_WHITE,
		justifyContent: 'center'
	},
	serverItemContainer: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	serverIcon: {
		width: 38,
		height: 38,
		marginHorizontal: 15,
		borderRadius: 4
	},
	serverTextContainer: {
		flex: 1,
		flexDirection: 'column',
		justifyContent: 'center'
	},
	serverName: {
		fontSize: 18,
		...sharedStyles.textColorNormal,
		...sharedStyles.textSemibold
	},
	serverUrl: {
		fontSize: 15,
		...sharedStyles.textColorDescription,
		...sharedStyles.textRegular
	}
});
