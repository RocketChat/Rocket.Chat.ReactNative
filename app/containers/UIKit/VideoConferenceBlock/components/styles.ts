import { StyleSheet } from 'react-native';

import { useTheme } from '../../../../theme';
import sharedStyles from '../../../../views/Styles';

export default function useStyle() {
	const { colors } = useTheme();
	const style = StyleSheet.create({
		container: { height: 108, flex: 1, borderWidth: 1, borderRadius: 4, marginTop: 8, borderColor: colors.surfaceNeutral },
		callInfoContainer: { flex: 1, alignItems: 'center', paddingLeft: 16, flexDirection: 'row' },
		infoContainerText: {
			fontSize: 12,
			marginLeft: 8,
			...sharedStyles.textBold,
			color: colors.fontHint
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
			backgroundColor: colors.surfaceNeutral,
			flexDirection: 'row',
			alignItems: 'center',
			paddingLeft: 16
		},
		callToActionButtonText: {
			fontSize: 12,
			...sharedStyles.textSemibold,
			color: colors.fontWhite
		},
		callToActionCallBackText: {
			fontSize: 12,
			...sharedStyles.textSemibold,
			color: colors.surfaceDark
		},
		callToActionButton: {
			backgroundColor: colors.badgeBackgroundLevel2,
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
			color: colors.fontDefault,
			marginLeft: 8
		},
		plusUsers: {
			width: 28,
			height: 28,
			backgroundColor: colors.surfaceNeutral,
			borderRadius: 4,
			alignItems: 'center',
			justifyContent: 'center'
		},
		plusUsersText: {
			fontSize: 14,
			...sharedStyles.textSemibold,
			color: colors.fontDefault,
			alignSelf: 'center'
		},
		callBack: {
			fontSize: 12,
			...sharedStyles.textRegular,
			color: colors.fontDefault
		},
		callToActionCallBack: {
			backgroundColor: colors.surfaceSelected,
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
			color: colors.strokeDark
		},
		enabledBackground: {
			backgroundColor: colors.strokeHighlight
		}
	});

	return style;
}
