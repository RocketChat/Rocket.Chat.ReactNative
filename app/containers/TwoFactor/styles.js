import { StyleSheet } from 'react-native';

import sharedStyles from '../../views/Styles';

export default StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center'
	},
	content: {
		padding: 16,
		width: '100%',
		borderRadius: 4
	},
	title: {
		fontSize: 14,
		paddingBottom: 8,
		...sharedStyles.textBold
	},
	subtitle: {
		fontSize: 14,
		paddingBottom: 8,
		...sharedStyles.textRegular,
		...sharedStyles.textAlignCenter
	},
	sendEmail: {
		fontSize: 14,
		paddingBottom: 24,
		paddingTop: 8,
		alignSelf: 'center',
		...sharedStyles.textRegular
	},
	button: {
		marginBottom: 0
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between'
	}
});
