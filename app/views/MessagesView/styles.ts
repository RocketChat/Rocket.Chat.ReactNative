import { StyleSheet } from 'react-native';

import { fontSize } from '../../lib/theme';
import sharedStyles from '../Styles';

export default StyleSheet.create({
	list: {
		flex: 1
	},
	listEmptyContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center'
	},
	noDataFound: {
		fontSize: fontSize[14],
		...sharedStyles.textRegular
	}
});
