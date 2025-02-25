import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	container: {
		flex: 1
	},
	header: {
		paddingVertical: 16,
		flexDirection: 'row',
		alignItems: 'center'
	},
	headerTextContainer: {
		flex: 1,
		flexDirection: 'column',
		alignItems: 'flex-start'
	},
	headerUsername: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	username: {
		fontSize: 14,
		...sharedStyles.textMedium
	},
	avatar: {
		marginHorizontal: 10
	},
	currentServerText: {
		fontSize: 14,
		...sharedStyles.textSemibold
	},
	customStatusDisabled: {
		width: 10,
		height: 10,
		borderRadius: 5
	}
});
