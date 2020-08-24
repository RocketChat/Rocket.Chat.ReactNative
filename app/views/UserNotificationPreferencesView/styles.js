import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	sectionSeparatorBorder: {
		height: 10
	},
	marginBottom: {
		height: 30
	},
	contentContainer: {
		marginVertical: 10
	},
	infoText: {
		...sharedStyles.textRegular,
		fontSize: 13,
		paddingHorizontal: 15,
		paddingVertical: 10
	},
	sectionTitle: {
		...sharedStyles.separatorBottom,
		paddingHorizontal: 15,
		paddingVertical: 10,
		fontSize: 14
	},
	pickerText: {
		...sharedStyles.textRegular,
		fontSize: 16
	}
});
