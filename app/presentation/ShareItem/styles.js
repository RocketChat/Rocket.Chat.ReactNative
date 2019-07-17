import { StyleSheet } from 'react-native';

import sharedStyles from '../../views/Styles';

export default StyleSheet.create({
	content: {
		height: 40,
		flexDirection: 'row',
		width: '100%',
		alignItems: 'center',
		paddingLeft: 14
	},
	name: {
		fontSize: 17,
		lineHeight: 20,
		...sharedStyles.textRegular,
		...sharedStyles.textColorNormal,
		flex: 1
	},
	center: {
		flex: 1,
		height: '100%',
		width: '100%',
		alignItems: 'center',
		flexDirection: 'row'
	},
	avatar: {
		marginRight: 10
	}
});
