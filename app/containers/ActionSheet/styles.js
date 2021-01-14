import { StyleSheet } from 'react-native';

import sharedStyles from '../../views/Styles';

export const ITEM_HEIGHT = 48;

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
		alignItems: 'center',
		paddingBottom: 8
	},
	handleIndicator: {
		width: 40,
		height: 4,
		borderRadius: 4,
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
	button: {
		marginHorizontal: 16,
		paddingHorizontal: 14,
		justifyContent: 'center',
		height: ITEM_HEIGHT,
		borderRadius: 2,
		marginBottom: 12
	},
	text: {
		fontSize: 16,
		...sharedStyles.textMedium,
		...sharedStyles.textAlignCenter
	}
});
