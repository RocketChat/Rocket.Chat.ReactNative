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
	titleContainer: {
		flex: 1
	},
	title: {
		fontSize: 16,
		...sharedStyles.textMedium
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
		marginHorizontal: '25%'
	},
	button: {
		marginHorizontal: 16,
		paddingHorizontal: 14,
		justifyContent: 'center',
		height: ITEM_HEIGHT,
		borderRadius: 4,
		marginBottom: 12
	},
	text: {
		fontSize: 16,
		...sharedStyles.textMedium,
		...sharedStyles.textAlignCenter
	},
	rightContainer: {
		paddingLeft: 12
	},
	footerButtonsContainer: {
		flexDirection: 'row',
		paddingTop: 16
	},
	buttonSeparator: {
		marginRight: 8
	},
	contentContainer: {
		flex: 1
	}
});
