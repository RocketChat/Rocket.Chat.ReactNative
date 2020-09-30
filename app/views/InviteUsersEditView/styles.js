import { StyleSheet } from 'react-native';
import { paddingHorizontal } from '../../containers/List/constants';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	innerContainer: {
		paddingHorizontal,
		paddingTop: 16
	},
	viewContainer: {
		justifyContent: 'center'
	},
	pickerText: {
		...sharedStyles.textRegular,
		fontSize: 16
	}
});
