import { StyleSheet } from 'react-native';

import sharedStyles from '../../views/Styles';
import { COLOR_WHITE } from '../../constants/colors';

export default StyleSheet.create({
	serverItem: {
		height: 68,
		backgroundColor: COLOR_WHITE
	},
	serverItemContainer: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	serverIcon: {
		width: 42,
		height: 42,
		marginHorizontal: 15,
		marginVertical: 13,
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
