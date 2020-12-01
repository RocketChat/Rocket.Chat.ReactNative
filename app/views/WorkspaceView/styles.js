import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	serverName: {
		...sharedStyles.textSemibold,
		fontSize: 16,
		marginBottom: 4
	},
	serverUrl: {
		...sharedStyles.textRegular,
		fontSize: 14,
		marginBottom: 24
	},
	registrationText: {
		fontSize: 14,
		...sharedStyles.textRegular,
		...sharedStyles.textAlignCenter
	},
	alignItemsCenter: {
		alignItems: 'center'
	}
});
