import { StyleSheet } from 'react-native';
import { paddingHorizontal } from '../../containers/List/constants';

export default StyleSheet.create({
	innerContainer: {
		padding: paddingHorizontal,
		paddingBottom: 0
	},
	divider: {
		width: '100%',
		height: StyleSheet.hairlineWidth,
		marginVertical: 20
	}
});
