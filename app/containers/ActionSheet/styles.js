import { StyleSheet } from 'react-native';

import sharedStyles from '../../views/Styles';

export const ITEM_HEIGHT = 46;

export default StyleSheet.create({
	item: {
		height: ITEM_HEIGHT,
		alignItems: 'center',
		flexDirection: 'row'
	},
	content: {
		paddingHorizontal: 16,
		paddingTop: 16
	},
	title: {
		fontSize: 16,
		marginLeft: 16,
		...sharedStyles.textRegular
	},
	handle: {
		overflow: 'hidden',
		borderTopLeftRadius: 16,
		borderTopRightRadius: 16,
		justifyContent: 'center',
		alignItems: 'center'
	},
	handleIndicator: {
		width: 40,
		height: 4,
		borderRadius: 2,
		margin: 8
	},
	backdrop: {
		...StyleSheet.absoluteFillObject
	},
	bottomSheet: {
		width: '50%',
		alignSelf: 'center',
		left: '25%'
	}
});
