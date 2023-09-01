import { StyleSheet } from 'react-native';

import sharedStyles from '../../views/Styles';

export const styles = StyleSheet.create({
	title: {
		fontSize: 20,
		lineHeight: 30,
		marginBottom: 24,
		...sharedStyles.textBold
	},
	subtitle: {
		fontSize: 16,
		lineHeight: 24,
		marginBottom: 24,
		...sharedStyles.textBold
	},
	description: {
		fontSize: 16,
		lineHeight: 24,
		marginBottom: 24,
		...sharedStyles.textRegular
	}
});
