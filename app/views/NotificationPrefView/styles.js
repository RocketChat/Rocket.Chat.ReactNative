import { StyleSheet } from 'react-native';

import { COLOR_BACKGROUND_CONTAINER } from '../../constants/colors';
import sharedStyles from '../Styles';

export default StyleSheet.create({
	sectionSeparatorBorder: {
		backgroundColor: COLOR_BACKGROUND_CONTAINER,
		height: 10
	},
	infoText: {
		paddingHorizontal: 15,
		backgroundColor: COLOR_BACKGROUND_CONTAINER
	},
	sectionTitle: {
		...sharedStyles.separatorBottom,
		paddingHorizontal: 15,
		backgroundColor: COLOR_BACKGROUND_CONTAINER
	},
	buttonContainerDisabled: {
		backgroundColor: 'rgba(65, 72, 82, 0.7)'
	},
	buttonContainer: {
		paddingVertical: 15,
		backgroundColor: '#414852',
		marginVertical: 20,
		marginHorizontal: 15,
		borderRadius: 2
	},
	container: {
		backgroundColor: COLOR_BACKGROUND_CONTAINER
	}
});
