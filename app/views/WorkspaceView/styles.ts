import { StyleSheet } from 'react-native';

import { fontSize } from '../../lib/theme';
import sharedStyles from '../Styles';

export default StyleSheet.create({
	serverName: {
		...sharedStyles.textMedium,
		fontSize: fontSize[16],
		marginBottom: 4
	},
	serverUrl: {
		...sharedStyles.textRegular,
		fontSize: fontSize[14],
		marginBottom: 24
	},
	registrationText: {
		fontSize: fontSize[14],
		...sharedStyles.textRegular,
		...sharedStyles.textAlignCenter
	},
	alignItemsCenter: {
		alignItems: 'center'
	}
});
