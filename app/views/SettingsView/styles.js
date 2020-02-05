import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	sectionSeparatorBorder: {
		...sharedStyles.separatorVertical,
		height: 36
	},
	listWithoutBorderBottom: {
		borderBottomWidth: 0
	},
	infoContainer: {
		padding: 15,
		marginBottom: 40
	},
	infoText: {
		fontSize: 14,
		...sharedStyles.textRegular
	}
});
