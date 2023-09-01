import { StyleSheet } from 'react-native';

import sharedStyles from '../../views/Styles';

export const styles = StyleSheet.create({
	ltsTitle: {
		fontSize: 20,
		lineHeight: 30,
		marginBottom: 24,
		...sharedStyles.textBold
	},
	ltsSubtitle: {
		fontSize: 16,
		lineHeight: 24,
		marginBottom: 24,
		...sharedStyles.textBold
	},
	ltsDescription: {
		fontSize: 16,
		lineHeight: 24,
		marginBottom: 24,
		...sharedStyles.textRegular
	}
});
