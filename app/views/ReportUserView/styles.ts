import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	containerView: {
		padding: 16
	},
	containerAvatarAndName: {
		flexDirection: 'row',
		marginBottom: 24,
		alignItems: 'center'
	},
	nameText: {
		fontSize: 16,
		...sharedStyles.textBold
	}
});
