import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';
import { COLOR_PRIMARY, COLOR_WHITE } from '../../constants/colors';

export default StyleSheet.create({
	button: {
		height: 54,
		backgroundColor: COLOR_WHITE
	},
	container: {
		flexDirection: 'row'
	},
	avatar: {
		marginHorizontal: 15,
		marginVertical: 12
	},
	textContainer: {
		flex: 1,
		flexDirection: 'column',
		justifyContent: 'center'
	},
	name: {
		fontSize: 17,
		...sharedStyles.textMedium,
		...sharedStyles.textColorNormal
	},
	username: {
		fontSize: 14,
		...sharedStyles.textRegular,
		...sharedStyles.textColorDescription
	},
	icon: {
		marginHorizontal: 15,
		alignSelf: 'center',
		color: COLOR_PRIMARY
	},
	followContainer: {
		flexDirection: 'row',
		alignItems: 'center'
	}
});
