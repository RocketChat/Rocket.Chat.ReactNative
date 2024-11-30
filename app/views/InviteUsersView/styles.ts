import { StyleSheet } from 'react-native';

import { PADDING_HORIZONTAL } from '../../containers/List/constants';

export default StyleSheet.create({
	innerContainer: {
		padding: PADDING_HORIZONTAL,
		paddingBottom: 0
	},
	divider: {
		width: '100%',
		height: 1,
		marginVertical: 20
	}
});
