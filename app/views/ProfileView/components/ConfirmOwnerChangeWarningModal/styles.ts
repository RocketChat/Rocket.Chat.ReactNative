import { StyleSheet } from 'react-native';

import sharedStyles from '../../../Styles';

export default StyleSheet.create({
	content: {
		padding: 18,
		width: '100%',
		borderRadius: 4
	},
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center'
	},
	title: {
		fontSize: 16,
		paddingBottom: 8,
		...sharedStyles.textBold,
		...sharedStyles.textAlignCenter
	},
	button: {
		marginBottom: 0
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between'
	},
	contentTitle: {
		marginBottom: 8,
		...sharedStyles.textBold
	},
	description: {
		marginVertical: 16
	},
	removedRooms: {
		paddingTop: 16
	}
});
