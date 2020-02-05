import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	sectionSeparatorBorder: {
		...sharedStyles.separatorVertical,
		height: 36
	},
	listPadding: {
		paddingVertical: 36
	},
	infoContainer: {
		padding: 15
	},
	infoText: {
		fontSize: 14,
		...sharedStyles.textRegular
	}
});
