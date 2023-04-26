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
			backgroundColor: colors.focusedBackground,
			borderColor: colors.separatorColor,
			flex: 1
		},
		content: {
			flex: 1
		},
		inner: {
			flex: 1
		},
		avatar: {
			marginRight: 10
		},
		roomName: {
			fontSize: 17,
			lineHeight: 20,
			color: colors.titleText,
			...sharedStyles.textMedium
		},
		message: {
			fontSize: 14,
			lineHeight: 17,
			color: colors.titleText,
			...sharedStyles.textRegular
		},
		close: {
			marginLeft: 10
		},
		small: {
			width: '50%',
			alignSelf: 'center'
		},
		row: {
			flexDirection: 'row'
		},
		closeButton: {
			backgroundColor: colors.passcodeButtonActive,
			marginRight: 8,
			alignItems: 'center',
			justifyContent: 'center',
			borderRadius: 4,
			width: 36,
			height: 36
		},
		cancelButton: {
			borderRadius: 4,
			backgroundColor: '#F5455C',
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
			backgroundColor: '#158D65',
			flex: 2,
			alignItems: 'center',
			justifyContent: 'center'
		}
	});
};
