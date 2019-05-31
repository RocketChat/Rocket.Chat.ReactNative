import { StyleSheet } from 'react-native';
import {
	COLOR_SEPARATOR, COLOR_PRIMARY, COLOR_BACKGROUND_CONTAINER
} from '../../constants/colors';
import sharedStyles from '../Styles';

export default StyleSheet.create({
	containerItem: {
		flex: 1,
		padding: 20,
		marginHorizontal: 4,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between'
	},
	text: {
		fontSize: 16,
		...sharedStyles.textRegular,
		...sharedStyles.textColorNormal
	},
	checkIcon: {
		color: COLOR_PRIMARY
	},
	separator: {
		height: StyleSheet.hairlineWidth,
		backgroundColor: COLOR_SEPARATOR,
		marginLeft: 15
	},
	containerScrollView: {
		paddingVertical: 15
	},
	container: {
		flex: 1,
		backgroundColor: COLOR_BACKGROUND_CONTAINER
	}
});
