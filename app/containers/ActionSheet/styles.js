import { StyleSheet } from 'react-native';

import sharedStyles from '../../views/Styles';

export const ITEM_HEIGHT = 44;

export default StyleSheet.create({
	item: {
		height: ITEM_HEIGHT,
		alignItems: 'center',
		flexDirection: 'row'
	},
	content: {
		paddingTop: 24,
		paddingHorizontal: 16
	},
	title: {
		fontSize: 16,
		marginLeft: 16,
		...sharedStyles.textRegular
	},
	modal: {
		overflow: 'hidden',
		borderTopLeftRadius: 16,
		borderTopRightRadius: 16
	},
	header: {
		fontSize: 18,
		paddingTop: 24,
		paddingBottom: 8,
		...sharedStyles.textAlignCenter,
		...sharedStyles.textBold
	},
	footer: {
		paddingHorizontal: 16
	}
});
