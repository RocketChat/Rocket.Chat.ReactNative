import { StyleSheet } from 'react-native';

import sharedStyles from '../../views/Styles';

export const styles = StyleSheet.create({
	passwordPoliciesTitle: {
		...sharedStyles.textMedium,
		fontSize: 14,
		lineHeight: 20
	},
	policies: {
		gap: 8,
		paddingTop: 8
	}
});
