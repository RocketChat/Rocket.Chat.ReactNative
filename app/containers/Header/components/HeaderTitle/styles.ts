import { StyleSheet } from 'react-native';

import sharedStyles from '../../../../views/Styles';

export const styles = StyleSheet.create({
	headerTitleContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center'
	},
	title: {
		...sharedStyles.textBold,
		fontSize: 16,
		justifyContent: 'center',
		alignItems: 'center'
	},
	androidTitle: {
		...sharedStyles.textBold,
		fontSize: 18,
		flex: 1
	}
});
