import { StyleSheet } from 'react-native';

import sharedStyles from '../../../../views/Styles';

export const styles = StyleSheet.create({
	headerTitleContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		minHeight: 24 
	},
	title: {
		...sharedStyles.textBold,
		fontSize: 18,
		flex: 1,
		lineHeight: 22, 
		paddingVertical: 2, 
		textAlignVertical: 'center' 
	},
	androidTitle: {
		...sharedStyles.textBold,
		fontSize: 18,
		flex: 1,
		lineHeight: 22, 
		paddingVertical: 2, 
		textAlignVertical: 'center' 
	}
});