import { StyleSheet } from 'react-native';

import sharedStyles from '../../views/Styles';

export default StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		padding: 16
	},
	content: {
		padding: 16,
		width: '100%',
		borderRadius: 4
	},
	title: {
		fontSize: 16,
		lineHeight: 24,
		marginBottom: 12,
		...sharedStyles.textBold,
		...sharedStyles.textAlignCenter
	},
	subtitle: {
		fontSize: 14,
		marginBottom: 12,
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
		justifyContent: 'space-between',
		marginTop: 36
	},
	tablet: {
		height: undefined
	},
	overlay: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center'
	},
	containerInput: {
		marginBottom: 0
	}
});
