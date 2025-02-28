import { StyleSheet } from 'react-native';

import { isTablet } from '../../lib/methods/helpers';
import sharedStyles from '../../views/Styles';

export const styles = StyleSheet.create({
	title: {
		...sharedStyles.textBold,
		fontSize: 16,
		flex: 1,
		lineHeight: 24
	},
	headerBackButton: {
		margin: 0,
		marginRight: isTablet ? 5 : -5
	},
	headerTitleContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center'
	}
});
