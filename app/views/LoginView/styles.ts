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
		fontSize: 22
	},
	inputContainer: {
		marginVertical: 16
	},
	bottomContainer: {
		flexDirection: 'column'
	},
	bottomContainerText: {
		...sharedStyles.textRegular,
		alignSelf: 'center',
		fontSize: 14,
		marginTop: 32
	},
	loginButton: {
		marginTop: 16
	},
	ugcContainer: {
		marginTop: 32
	},
	createAccountButton: {
		marginTop: 12
	},
	forgotPasswordButton: {
		marginTop: 12
	}
});
