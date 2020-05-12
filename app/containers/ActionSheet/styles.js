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
		paddingHorizontal: 16
	},
	title: {
		fontSize: 16,
		marginLeft: 16,
		...sharedStyles.textRegular
	},
	shadow: {
		...StyleSheet.absoluteFillObject
	},
	header: {
		width: '100%',
		height: 24,
		alignItems: 'center',
		justifyContent: 'center',
		borderTopLeftRadius: 16,
		borderTopRightRadius: 16
	},
	headerItem: {
		height: 36,
		width: 36,
		borderRadius: 18,
		marginHorizontal: 8,
		justifyContent: 'center',
		alignItems: 'center'
	},
	headerList: {
		paddingBottom: 16
	},
	headerIcon: {
		fontSize: 20,
		color: '#fff'
	},
	headerIndicator: {
		width: 36,
		height: 4,
		borderRadius: 2
	}
});
