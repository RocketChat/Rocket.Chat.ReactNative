import { StyleSheet } from 'react-native';

import { PADDING_HORIZONTAL } from '../../containers/List/constants';
import sharedStyles from '../Styles';

export const styles = StyleSheet.create({
	container: {
		paddingHorizontal: PADDING_HORIZONTAL,
		gap: 8
	},
	title: {
		fontSize: 22,
		lineHeight: 30,
		...sharedStyles.textBold
	},
	description: {
		fontSize: 16,
		lineHeight: 22,
		...sharedStyles.textRegular
	},
	changePasswordButton: {
		marginBottom: 0
	},
	separator: {
		marginVertical: 16
	},
	content: {
		gap: 32
	}
});
