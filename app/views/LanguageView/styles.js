import { StyleSheet } from 'react-native';
import {
	COLOR_SEPARATOR, COLOR_PRIMARY, COLOR_BACKGROUND_CONTAINER, COLOR_WHITE
} from '../../constants/colors';
import sharedStyles from '../Styles';

export default StyleSheet.create({
	checkIcon: {
		color: COLOR_PRIMARY
	},
	separator: {
		height: StyleSheet.hairlineWidth,
		backgroundColor: COLOR_SEPARATOR,
		marginLeft: 15
	},
	contentContainerStyle: {
		...sharedStyles.separatorVertical,
		backgroundColor: COLOR_WHITE,
		marginVertical: 10
	},
	container: {
		flex: 1,
		backgroundColor: COLOR_BACKGROUND_CONTAINER
	}
});
