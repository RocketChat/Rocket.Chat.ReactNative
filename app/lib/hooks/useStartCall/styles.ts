import { StyleSheet } from 'react-native';

import sharedStyles from '../../../views/Styles';

export const ROW_HEIGHT = 56;

export default StyleSheet.create({
	buttonText: {
		fontSize: 16,
		marginRight: 12,
		paddingVertical: 10,
		...sharedStyles.textRegular
	},
	button: {
		height: 46,
		justifyContent: 'center',
		marginBottom: 0
	}
});
