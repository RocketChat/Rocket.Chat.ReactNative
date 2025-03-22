import { StyleSheet } from 'react-native';

import sharedStyles from '../../views/Styles';

export const ROW_HEIGHT = 56;

export default StyleSheet.create({
	serverItemContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 12
	},
	serverIcon: {
		width: 44,
		height: 44,
		borderRadius: 4
	},
	serverTextContainer: {
		flex: 1,
		flexDirection: 'column',
		justifyContent: 'center',
		paddingRight: 18,
		paddingLeft: 12
	},
	serverName: {
		fontSize: 18,
		...sharedStyles.textSemibold
	},
	serverUrl: {
		fontSize: 16,
		...sharedStyles.textRegular
	}
});
