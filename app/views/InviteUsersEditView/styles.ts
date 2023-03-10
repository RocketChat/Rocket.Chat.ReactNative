import { StyleSheet } from 'react-native';

import { PADDING_HORIZONTAL } from '../../containers/List/constants';
import sharedStyles from '../Styles';

export default StyleSheet.create({
	innerContainer: {
		paddingHorizontal: PADDING_HORIZONTAL,
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
