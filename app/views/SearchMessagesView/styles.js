import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	searchContainer: {
		padding: 20,
		paddingBottom: 0
	},
	list: {
		flex: 1
	},
	divider: {
		width: '100%',
		height: StyleSheet.hairlineWidth,
		marginVertical: 20
	},
	listEmptyContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'flex-start'
	},
	noDataFound: {
		fontSize: 14,
		...sharedStyles.textRegular
	}
});
