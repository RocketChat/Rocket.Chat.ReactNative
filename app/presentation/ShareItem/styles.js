import { StyleSheet } from 'react-native';

import sharedStyles from '../../views/Styles';

export const ROW_HEIGHT = 40;

export default StyleSheet.create({
	content: {
		height: ROW_HEIGHT,
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
