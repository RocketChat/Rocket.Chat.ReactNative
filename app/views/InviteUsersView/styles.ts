import { StyleSheet } from 'react-native-unistyles';

import { PADDING_HORIZONTAL } from '../../containers/List/constants';

export default StyleSheet.create({
	innerContainer: {
		padding: PADDING_HORIZONTAL,
		paddingBottom: 0
	},
	divider: {
		width: '100%',
		height: StyleSheet.hairlineWidth,
		marginVertical: 20
	}
});
