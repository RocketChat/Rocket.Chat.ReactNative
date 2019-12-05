import { StyleSheet } from 'react-native';

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
		fontSize: 14,
		...sharedStyles.textRegular
	},
	contentContainer: {
		paddingBottom: 30
	},
	separator: {
		height: StyleSheet.hairlineWidth,
		width: '100%',
		marginLeft: 60,
		marginTop: 10
	}
});
