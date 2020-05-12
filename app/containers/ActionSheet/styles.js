import { StyleSheet } from 'react-native';

import sharedStyles from '../../views/Styles';

const ITEM_HEIGHT = 44;

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
	headerTitle: {
		paddingVertical: 16,
		justifyContent: 'center',
		alignItems: 'center'
	},
	headerTitleText: {
		fontSize: 20,
		...sharedStyles.textBold
	},
	headerIndicator: {
		width: 36,
		height: 4,
		borderRadius: 2
	}
});
