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
		flex: 1,
		paddingVertical: 6
	},
	androidTitle: {
		...sharedStyles.textBold,
		flex: 1,
		paddingVertical: 10
	}
});
