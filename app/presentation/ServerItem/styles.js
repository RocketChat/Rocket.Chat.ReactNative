import { StyleSheet } from 'react-native';
import {
	COLOR_SEPARATOR, COLOR_PRIMARY
} from '../../constants/colors';

import sharedStyles from '../../views/Styles';

export default StyleSheet.create({
	serverItem: {
		height: 68
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
	},
	checkIcon: {
		marginHorizontal: 15,
		color: COLOR_PRIMARY
	},
	serverSeparator: {
		height: StyleSheet.hairlineWidth,
		backgroundColor: COLOR_SEPARATOR,
		marginLeft: 72
	}
});
