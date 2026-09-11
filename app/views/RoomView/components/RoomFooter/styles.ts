import { StyleSheet } from 'react-native';

import sharedStyles from '../../../Styles';

export default StyleSheet.create({
	readOnly: {
		justifyContent: 'flex-end',
		alignItems: 'center',
		margin: 16,
		marginBottom: 32
	},
	readOnlyDescription: {
		fontSize: 16,
		lineHeight: 24,
		...sharedStyles.textRegular,
		textAlign: 'center'
	},
	joinRoomContainer: {
		justifyContent: 'flex-end',
		alignItems: 'center',
		marginVertical: 15
	},
	joinRoomButton: {
		width: 107,
		height: 44,
		marginTop: 15,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 4
	},
	joinRoomText: {
		fontSize: 14,
		...sharedStyles.textMedium
	},
	previewMode: {
		fontSize: 16,
		lineHeight: 24,
		...sharedStyles.textSemibold
	}
});
