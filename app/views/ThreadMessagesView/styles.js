import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';
import { COLOR_WHITE, COLOR_SEPARATOR } from '../../constants/colors';

export default StyleSheet.create({
	list: {
		flex: 1,
		backgroundColor: COLOR_WHITE
	},
	listEmptyContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: COLOR_WHITE
	},
	noDataFound: {
		fontSize: 14,
		...sharedStyles.textRegular,
		...sharedStyles.textColorNormal
	},
	contentContainer: {
		paddingBottom: 30
	},
	separator: {
		height: StyleSheet.hairlineWidth,
		width: '100%',
		marginLeft: 60,
		marginTop: 10,
		backgroundColor: COLOR_SEPARATOR
	}
});
