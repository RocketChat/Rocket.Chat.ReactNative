import { PixelRatio, StyleSheet } from 'react-native';

import { useTheme } from '../../../theme';
import sharedStyles from '../../../views/Styles';

export const useStyle = () => {
	const { colors } = useTheme();
	return StyleSheet.create({
		container: {
			height: 160 * PixelRatio.getFontScale(),
			paddingHorizontal: 24,
			paddingVertical: 18,
			marginHorizontal: 10,
			borderWidth: StyleSheet.hairlineWidth,
			borderRadius: 4,
			backgroundColor: colors.surfaceLight,
			borderColor: colors.strokeLight,
			flex: 1
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
			backgroundColor: colors.buttonBackgroundSecondaryDefault,
			marginRight: 8,
			alignItems: 'center',
			justifyContent: 'center',
			borderRadius: 4,
			width: 36,
			height: 36
		},
		cancelButton: {
			borderRadius: 4,
			backgroundColor: colors.buttonBackgroundDangerDefault,
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
			backgroundColor: colors.buttonBackgroundSuccessDefault,
			flex: 2,
			alignItems: 'center',
			justifyContent: 'center'
		}
	});
};
