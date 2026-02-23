import { StyleSheet } from 'react-native';

import sharedStyles from '../../../Styles';

export const styles = StyleSheet.create({
	container: {
		padding: 32,
		paddingBottom: 32
	},
	inputContainer: {
		marginBottom: 24
	},
	grid: {
		padding: 10,
		gap: 28
	},
	row: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		gap: 40
	},
	button: {
		flex: 1,
		aspectRatio: 1,
		borderRadius: 8
	},
	digitContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		flex: 1
	},
	digit: {
		...sharedStyles.textRegular,
		fontSize: 32,
		lineHeight: 36,
		textAlign: 'center'
	},
	letters: {
		...sharedStyles.textRegular,
		fontSize: 12,
		lineHeight: 18,
		textAlign: 'center',
		letterSpacing: 0
	}
});
