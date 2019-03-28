import { StyleSheet } from 'react-native';

import sharedStyles from '../../Styles';

export default StyleSheet.create({
	header: {
		zIndex: 2,
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1
	},
	inputSearch: {
		flex: 1,
		fontSize: 18,
		color: '#fff',
		...sharedStyles.textRegular
	}
});
