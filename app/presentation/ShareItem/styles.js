import { StyleSheet } from 'react-native';
import sharedStyles from '../../views/Styles';
import { COLOR_WHITE } from '../../constants/colors';

export default StyleSheet.create({
	content: {
		height: 40,
		flexDirection: 'row',
		width: '100%',
		alignItems: 'center',
		marginLeft: 14,
		paddingRight: 16,
		backgroundColor: COLOR_WHITE
	},
	name: {
		fontSize: 17,
		lineHeight: 20,
		...sharedStyles.textRegular,
		...sharedStyles.textColorNormal,
		width: '80%'
	},
	center: {
		flex: 1,
		height: '100%',
		width: '100%',
		alignItems: 'center',
		justifyContent: 'space-between',
		flexDirection: 'row'
	},
	avatar: {
		marginRight: 10
	}
});
