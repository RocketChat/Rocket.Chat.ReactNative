import { StyleSheet } from 'react-native';
import {
	COLOR_SEPARATOR, COLOR_PRIMARY, COLOR_TEXT
} from '../../constants/colors';

export default StyleSheet.create({
	containerItem: {
		flex: 1,
		padding: 18,
		marginHorizontal: 4,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between'
	},
	text: {
		fontSize: 16,
		color: COLOR_TEXT
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
	}

});
