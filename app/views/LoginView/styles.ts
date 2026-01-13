import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	registerDisabled: {
		...sharedStyles.textRegular,
		...sharedStyles.textAlignCenter,
		fontSize: 16
	},
	title: {
		...sharedStyles.textBold,
		fontSize: 22,
		marginBottom: 24
	},
	inputContainer: {
		marginVertical: 16
	},
	credentialsContainer: {
		gap: 20
	},
	bottomContainer: {
		flexDirection: 'column',
		gap: 32,
		marginTop: 32
	},
	bottomContainerGroup: {
		gap: 12
	},
	bottomContainerText: {
		...sharedStyles.textMedium,
		alignSelf: 'center',
		fontSize: 14
	}
});
