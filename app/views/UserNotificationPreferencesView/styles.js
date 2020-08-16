import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	marginBottom: {
		height: 30
	},
	contentContainer: {
		marginVertical: 10
	},
	pickerText: {
		...sharedStyles.textRegular,
		fontSize: 16
	}
});
