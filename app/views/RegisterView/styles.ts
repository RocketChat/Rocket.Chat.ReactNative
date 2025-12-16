import { StyleSheet } from 'react-native-unistyles';

import sharedStyles from '../Styles';

const styles = StyleSheet.create({
	title: {
		...sharedStyles.textBold,
		fontSize: 24,
		lineHeight: 36
	},
	inputs: {
		gap: 12,
		paddingTop: 24,
		paddingBottom: 12
	},
	inputContainer: {
		marginTop: 0,
		marginBottom: 0
	},
	bottomContainer: {
		marginBottom: 32
	},
	bottomContainerText: {
		...sharedStyles.textMedium,
		fontSize: 14,
		lineHeight: 22,
		alignSelf: 'center'
	},
	registerButton: {
		marginTop: 36,
		marginBottom: 32
	},
	loginButton: {
		marginTop: 12
	}
});

export default styles;
