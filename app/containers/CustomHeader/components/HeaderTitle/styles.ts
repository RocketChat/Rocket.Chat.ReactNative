import { StyleSheet } from 'react-native';

import sharedStyles from '../../../../views/Styles';

export const styles = StyleSheet.create({
	headerTitleContainer: {
		flex: 1
	},
	title: {
		...sharedStyles.textBold,
		fontSize: 18,
		flex: 1,
		lineHeight: 24,
		paddingVertical: 6
	},
	androidTitle: {
		...sharedStyles.textBold,
		fontSize: 18,
		flex: 1,
		lineHeight: 24,
		paddingVertical: 10
	}
});
