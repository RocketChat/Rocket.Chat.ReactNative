import { StyleSheet } from 'react-native';

import sharedStyles from '../../views/Styles';

export const ROW_HEIGHT = 110;

export default StyleSheet.create({
	directoryItemButton: {
		height: ROW_HEIGHT,
		borderRadius: 11,
		margin: 12,
		elevation: 5,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84
	},
	directoryItemContainer: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 15
	},
	directoryItemAvatar: {
		marginRight: 12
	},
	directoryItemTextTitle: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	directoryItemTextContainer: {
		flex: 1,
		flexDirection: 'column',
		justifyContent: 'center'
	},
	directoryItemName: {
		flex: 1,
		fontSize: 17,
		...sharedStyles.textMedium
	},
	directoryItemUsername: {
		fontSize: 14,
		alignItems: 'center',
		...sharedStyles.textRegular
	},
	directoryItemLabel: {
		fontSize: 14,
		paddingLeft: 10,
		...sharedStyles.textRegular
	},
	directoryItemAge: {
		fontSize: 14,
		...sharedStyles.textRegular,
		alignItems: 'center',
		paddingLeft: 5
	}
});
