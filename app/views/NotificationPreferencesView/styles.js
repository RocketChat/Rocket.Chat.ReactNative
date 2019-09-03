import { StyleSheet } from 'react-native';

import { COLOR_BACKGROUND_CONTAINER, COLOR_PRIMARY, COLOR_WHITE } from '../../constants/colors';
import sharedStyles from '../Styles';

export default StyleSheet.create({
	sectionSeparatorBorder: {
		backgroundColor: COLOR_BACKGROUND_CONTAINER,
		height: 10
	},
	marginBottom: {
		height: 30,
		backgroundColor: COLOR_BACKGROUND_CONTAINER
	},
	contentContainer: {
		backgroundColor: COLOR_WHITE,
		marginVertical: 10
	},
	infoText: {
		...sharedStyles.textRegular,
		...sharedStyles.textColorNormal,
		fontSize: 13,
		paddingHorizontal: 15,
		paddingVertical: 10,
		backgroundColor: COLOR_BACKGROUND_CONTAINER
	},
	sectionTitle: {
		...sharedStyles.separatorBottom,
		paddingHorizontal: 15,
		backgroundColor: COLOR_BACKGROUND_CONTAINER,
		paddingVertical: 10,
		fontSize: 14,
		...sharedStyles.textColorNormal
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
