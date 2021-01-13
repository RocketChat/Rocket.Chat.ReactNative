import { StyleSheet } from 'react-native';

import sharedStyles from '../../views/Styles';

export const ROW_HEIGHT = 56;

export default StyleSheet.create({
	serverItem: {
		height: ROW_HEIGHT,
		justifyContent: 'center'
	},
	serverItemContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		height: 68
	},
	serverIcon: {
		width: 44,
		height: 44,
		marginHorizontal: 12,
		marginVertical: 13,
		borderRadius: 4,
		resizeMode: 'contain'
	},
	serverTextContainer: {
		flex: 1,
		flexDirection: 'column',
		justifyContent: 'center'
	},
	serverName: {
		fontSize: 18,
		marginRight: 16,
		...sharedStyles.textSemibold
	},
	serverUrl: {
		fontSize: 16,
		marginRight: 18,
		...sharedStyles.textRegular
	}
});
