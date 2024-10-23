import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';

const styles = StyleSheet.create({
	onboardingImage: {
		alignSelf: 'center',
		resizeMode: 'contain'
	},
	title: {
		...sharedStyles.textBold,
		letterSpacing: 0,
		alignSelf: 'center'
	},
	subtitle: {
		...sharedStyles.textRegular,
		alignSelf: 'center'
	},
	description: {
		...sharedStyles.textRegular,
		textAlign: 'center'
	},
	connectButton: {
		marginBottom: 0
	}
});

export default styles;
