import { StyleSheet } from 'react-native-unistyles';

import sharedStyles from '../../Styles';

export default StyleSheet.create((_theme, rt) => ({
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
	},
	listItem: {
		marginTop: 36
	},
	datePickerContainer: {
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: rt.insets.bottom
	}
}));
