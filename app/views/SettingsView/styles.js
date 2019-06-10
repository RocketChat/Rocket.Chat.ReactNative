import { StyleSheet } from 'react-native';

import {
	COLOR_SEPARATOR, COLOR_WHITE, COLOR_BACKGROUND_CONTAINER
} from '../../constants/colors';
import sharedStyles from '../Styles';

export default StyleSheet.create({
	contentContainer: {
		...sharedStyles.separatorVertical,
		backgroundColor: COLOR_WHITE,
		marginVertical: 10
	},
	container: {
		flex: 1,
		backgroundColor: COLOR_BACKGROUND_CONTAINER
	},
	disclosureIndicator: {
		marginLeft: 0,
		marginRight: 0
	},
	separator: {
		height: StyleSheet.hairlineWidth,
		backgroundColor: COLOR_SEPARATOR
	},
	sectionSeparatorBorder: {
		...sharedStyles.separatorVertical,
		backgroundColor: COLOR_BACKGROUND_CONTAINER,
		height: 10
	}
});
