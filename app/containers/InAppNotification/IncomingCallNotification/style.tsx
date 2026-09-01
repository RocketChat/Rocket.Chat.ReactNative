import { PixelRatio, StyleSheet } from 'react-native';

import { useTheme } from '../../../theme';
import sharedStyles from '../../../views/Styles';

const BUTTON_HEIGHT = 36;

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
		// Touch only forwards backgroundColor, borderRadius and margins to the RectButton, so sizing
		// goes through rectButtonStyle - on style it lands on the inner View and the button collapses
		closeButton: {
			backgroundColor: colors.buttonBackgroundSecondaryDefault,
			marginRight: 8,
			borderRadius: 4
		},
		closeButtonContainer: {
			width: BUTTON_HEIGHT,
			height: BUTTON_HEIGHT,
			alignItems: 'center',
			justifyContent: 'center'
		},
		cancelButton: {
			borderRadius: 4,
			backgroundColor: colors.buttonBackgroundDangerDefault,
			marginRight: 8
		},
		acceptButton: {
			borderRadius: 4,
			backgroundColor: colors.buttonBackgroundSuccessDefault
		},
		// decline and accept share the remaining width evenly, minHeight so the label can grow
		buttonWrapper: {
			flex: 1
		},
		buttonContainer: {
			minHeight: BUTTON_HEIGHT,
			alignItems: 'center',
			justifyContent: 'center'
		},
		buttonText: {
			...sharedStyles.textMedium,
			color: 'white'
		}
	});
};
