import { StyleSheet } from 'react-native';

import { COLOR_BACKGROUND_CONTAINER } from '../../constants/colors';
import sharedStyles from '../Styles';

export default StyleSheet.create({
	sectionSeparatorBorder: {
		...sharedStyles.separatorVertical,
		backgroundColor: COLOR_BACKGROUND_CONTAINER,
		height: 10
	}
});
