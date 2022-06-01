import { StyleSheet } from 'react-native';

import { fontSize } from '../../lib/theme';
import sharedStyles from '../../views/Styles';

export const ROW_HEIGHT = 56;

export default StyleSheet.create({
	serverItemContainer: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	serverIcon: {
		width: 44,
		height: 44,
		margin: 12,
		borderRadius: 4,
		resizeMode: 'contain'
	},
	serverTextContainer: {
		flex: 1,
		flexDirection: 'column',
		justifyContent: 'center',
		paddingRight: 18
	},
	serverName: {
		fontSize: fontSize[16],
		...sharedStyles.textMedium
	},
	serverUrl: {
		fontSize: fontSize[14],
		...sharedStyles.textRegular
	}
});
