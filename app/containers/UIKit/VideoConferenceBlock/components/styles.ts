import { StyleSheet } from 'react-native';

import { useTheme } from '../../../../theme';
import sharedStyles from '../../../../views/Styles';

export default function useStyle() {
	const { colors } = useTheme();
	const style = StyleSheet.create({
		container: { height: 108, flex: 1, borderWidth: 1, borderRadius: 4, marginTop: 8, borderColor: colors.conferenceCallBorder },
		callInfoContainer: { flex: 1, alignItems: 'center', paddingLeft: 16, flexDirection: 'row' },
		infoContainerText: {
			fontSize: 12,
			marginLeft: 8,
			...sharedStyles.textBold,
			color: colors.auxiliaryTintColor
		},
		iconContainer: {
			width: 28,
			height: 28,
			alignItems: 'center',
			justifyContent: 'center',
			borderRadius: 4
		},
		callToActionContainer: {
			height: 48,
			backgroundColor: colors.conferenceCallBackground,
			flexDirection: 'row',
			alignItems: 'center',
			paddingLeft: 16
		},
		callToActionButtonText: {
			fontSize: 12,
			...sharedStyles.textSemibold,
			color: colors.buttonText
		},
		callToActionCallBackText: {
			fontSize: 12,
			...sharedStyles.textSemibold,
			color: colors.conferenceCallCallBackText
		},
		callToActionButton: {
			backgroundColor: colors.tintColor,
			minWidth: 50,
			alignItems: 'center',
			justifyContent: 'center',
			height: 32,
			borderRadius: 4,
			marginRight: 8,
			paddingHorizontal: 8
		},
		joined: {
			fontSize: 12,
			...sharedStyles.textRegular,
			color: colors.passcodeSecondary,
			marginLeft: 8
		},
		plusUsers: {
			width: 28,
			height: 28,
			backgroundColor: colors.conferenceCallPlusUsersButton,
			borderRadius: 4,
			alignItems: 'center',
			justifyContent: 'center'
		},
		plusUsersText: {
			fontSize: 14,
			...sharedStyles.textSemibold,
			color: colors.conferenceCallPlusUsersText,
			alignSelf: 'center'
		},
		callBack: {
			fontSize: 12,
			...sharedStyles.textRegular,
			color: colors.passcodeSecondary
		},
		callToActionCallBack: {
			backgroundColor: colors.conferenceCallPlusUsersButton,
			minWidth: 50,
			alignItems: 'center',
			justifyContent: 'center',
			height: 32,
			borderRadius: 4,
			marginRight: 8,
			paddingHorizontal: 8
		},
		notAnswered: {
			fontSize: 12,
			...sharedStyles.textRegular,
			color: colors.passcodeSecondary
		},
		enabledBackground: {
			backgroundColor: colors.conferenceCallEnabledIconBackground
		}
	});

	return style;
}
