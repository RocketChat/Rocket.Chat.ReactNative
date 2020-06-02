import { StyleSheet } from 'react-native';

import sharedStyles from '../../views/Styles';

export const ITEM_HEIGHT = 46;

export default StyleSheet.create({
	container: {
		overflow: 'hidden',
		borderTopLeftRadius: 16,
		borderTopRightRadius: 16
	},
	item: {
		paddingHorizontal: 16,
		height: ITEM_HEIGHT,
		alignItems: 'center',
		flexDirection: 'row'
	},
	separator: {
		marginHorizontal: 16
	},
	content: {
		paddingTop: 16
	},
	title: {
		fontSize: 16,
		marginLeft: 16,
		...sharedStyles.textRegular
	},
	handle: {
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
	},
	footer: {
		marginHorizontal: 16
	}
});
