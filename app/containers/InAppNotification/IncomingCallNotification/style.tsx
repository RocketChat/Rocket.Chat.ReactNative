import { StyleSheet } from 'react-native-unistyles';

import sharedStyles from '../../../views/Styles';

export const styles = StyleSheet.create((theme, rt) => ({
	container: {
		height: 160 * rt.fontScale,
		paddingHorizontal: 24,
		paddingVertical: 18,
		marginHorizontal: 10,
		borderWidth: StyleSheet.hairlineWidth,
		borderRadius: 4,
		backgroundColor: theme.colors.surfaceLight,
		borderColor: theme.colors.strokeLight,
		flex: 1,
		marginTop: rt.insets.top
	},
	small: {
		width: '50%',
		alignSelf: 'center'
	},
	row: {
		flexDirection: 'row',
		marginTop: 12
	},
	closeButton: {
		backgroundColor: theme.colors.buttonBackgroundSecondaryDefault,
		marginRight: 8,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 4,
		width: 36,
		height: 36
	},
	cancelButton: {
		borderRadius: 4,
		backgroundColor: theme.colors.buttonBackgroundDangerDefault,
		marginRight: 8,
		flex: 2,
		alignItems: 'center',
		justifyContent: 'center'
	},
	buttonText: {
		...sharedStyles.textMedium,
		color: 'white'
	},
	acceptButton: {
		borderRadius: 4,
		backgroundColor: theme.colors.buttonBackgroundSuccessDefault,
		flex: 2,
		alignItems: 'center',
		justifyContent: 'center'
	}
}));
