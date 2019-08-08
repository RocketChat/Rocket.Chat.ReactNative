import { StyleSheet } from 'react-native';

import { COLOR_BACKGROUND_CONTAINER, COLOR_PRIMARY } from '../../constants/colors';
import sharedStyles from '../Styles';

export default StyleSheet.create({
	sectionSeparatorBorder: {
		backgroundColor: COLOR_BACKGROUND_CONTAINER,
		height: 10
	},
	infoText: {
		...sharedStyles.textRegular,
		...sharedStyles.textColorNormal,
		fontSize: 14,
		paddingHorizontal: 15,
		backgroundColor: COLOR_BACKGROUND_CONTAINER
	},
	sectionTitle: {
		...sharedStyles.separatorBottom,
		paddingHorizontal: 15,
		backgroundColor: COLOR_BACKGROUND_CONTAINER
	},
	viewContainer: {
		justifyContent: 'center'
	},
	pickerText: {
		...sharedStyles.textRegular,
		fontSize: 16,
		color: COLOR_PRIMARY
	}
});
