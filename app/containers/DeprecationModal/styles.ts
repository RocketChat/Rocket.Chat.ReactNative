import { StyleSheet } from 'react-native';

import sharedStyles from '../../views/Styles';

export default StyleSheet.create({
	overlay: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center'
	},
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 16
	},
	content: {
		padding: 24,
		width: '100%',
		borderRadius: 8
	},
	tablet: {
		height: undefined
	},
	title: {
		fontSize: 18,
		lineHeight: 26,
		marginBottom: 12,
		...sharedStyles.textBold,
		...sharedStyles.textAlignCenter
	},
	body: {
		fontSize: 14,
		lineHeight: 20,
		marginBottom: 16,
		...sharedStyles.textRegular,
		...sharedStyles.textAlignCenter
	},
	urlLabel: {
		fontSize: 12,
		lineHeight: 18,
		marginBottom: 4,
		...sharedStyles.textRegular,
		...sharedStyles.textAlignCenter
	},
	url: {
		fontSize: 13,
		lineHeight: 20,
		marginBottom: 16,
		...sharedStyles.textMedium,
		...sharedStyles.textAlignCenter
	},
	buttonContainer: {
		marginTop: 12
	},
	button: {
		marginBottom: 8
	}
});
