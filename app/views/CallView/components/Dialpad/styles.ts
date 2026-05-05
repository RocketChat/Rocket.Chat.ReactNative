import { StyleSheet } from 'react-native';

import sharedStyles from '../../../Styles';

export const styles = StyleSheet.create({
	container: {
		padding: 32,
		paddingBottom: 32,
		maxWidth: 400,
		alignSelf: 'center',
		width: '100%'
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
		justifyContent: 'center',
		gap: 40
	},
	button: {
		flex: 1,
		maxWidth: 68,
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
	digitLarge: {
		fontSize: 38,
		lineHeight: 40,
		textAlign: 'center',
		textAlignVertical: 'center'
	},
	letters: {
		...sharedStyles.textRegular,
		fontSize: 12,
		lineHeight: 18,
		textAlign: 'center',
		letterSpacing: 0
	},
	landscapeContainer: {
		flexDirection: 'row',
		padding: 24
	},
	landscapeInputSection: {
		flex: 1,
		justifyContent: 'center',
		paddingRight: 16
	},
	landscapeGridSection: {
		flex: 1
	}
});
