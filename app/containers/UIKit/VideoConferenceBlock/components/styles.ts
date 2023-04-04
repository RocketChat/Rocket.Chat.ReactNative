import { StyleSheet } from 'react-native';

import { useTheme } from '../../../../theme';
import sharedStyles from '../../../../views/Styles';

export default function useStyle() {
	const { colors } = useTheme();
	return StyleSheet.create({
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
		actionSheetContainer: {
			paddingHorizontal: 24,
			flex: 1
		},
		actionSheetHeaderTitle: {
			fontSize: 14,
			...sharedStyles.textBold,
			color: colors.passcodePrimary
		},
		actionSheetUsername: {
			fontSize: 16,
			...sharedStyles.textBold,
			color: colors.passcodePrimary,
			flexShrink: 1
		},
		enabledBackground: {
			backgroundColor: colors.conferenceCallEnabledIconBackground
		},
		iconCallContainer: {
			padding: 6,
			borderRadius: 4
		},
		actionSheetHeader: { flexDirection: 'row', alignItems: 'center' },
		actionSheetHeaderButtons: { flex: 1, alignItems: 'center', flexDirection: 'row', justifyContent: 'flex-end' },
		actionSheetUsernameContainer: { flexDirection: 'row', paddingTop: 8, alignItems: 'center' },
		actionSheetPhotoContainer: {
			height: 220,
			width: 148,
			backgroundColor: colors.conferenceCallPhotoBackground,
			borderRadius: 8,
			margin: 24,
			alignSelf: 'center',
			justifyContent: 'center',
			alignItems: 'center'
		}
	});
}
