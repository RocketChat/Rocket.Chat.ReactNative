import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	list: {
		flex: 1
	},
	item: {
		flexDirection: 'row',
		paddingVertical: 10,
		paddingHorizontal: 16,
		alignItems: 'center'
	},
	avatar: {
		marginRight: 16
	},
	separator: {
		height: StyleSheet.hairlineWidth,
		marginLeft: 60
	},
	noResult: {
		fontSize: 16,
		paddingVertical: 56,
		...sharedStyles.textSemibold,
		...sharedStyles.textAlignCenter
	}
});
