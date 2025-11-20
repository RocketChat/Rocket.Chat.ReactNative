import { StyleSheet } from 'react-native-unistyles';

import sharedStyles from '../Styles';

const styles = StyleSheet.create({
	onboardingImage: {
		alignSelf: 'center',
		width: 250,
		height: 50,
		marginBottom: 32
	},
	title: {
		...sharedStyles.textBold,
		fontSize: 24,
		lineHeight: 36,
		marginBottom: 24
	},
	buttonPrompt: {
		...sharedStyles.textRegular,
		textAlign: 'center',
		lineHeight: 20
	},
	connectButton: {
		marginTop: 36
	}
});

export default styles;
