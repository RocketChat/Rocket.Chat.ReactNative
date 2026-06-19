import { StyleSheet } from 'react-native';

import sharedStyles from '../../Styles';

export default StyleSheet.create({
	pickerText: {
		...sharedStyles.textRegular,
		fontSize: 16
	},
	pickerItem: {
		height: 48
	},
	buttonContainer: {
		paddingHorizontal: 16,
		alignSelf: 'stretch'
	},
	confirmButton: {
		marginTop: 24
	}
});
