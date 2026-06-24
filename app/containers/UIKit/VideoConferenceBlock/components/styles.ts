import { StyleSheet } from 'react-native-unistyles';

import sharedStyles from '../../../../views/Styles';

export default StyleSheet.create(theme => ({
	container: { height: 108, flex: 1, borderWidth: 1, borderRadius: 4, marginTop: 8, borderColor: theme.colors.surfaceNeutral },
	callInfoContainer: { flex: 1, alignItems: 'center', paddingLeft: 16, flexDirection: 'row' },
	infoContainerText: {
		fontSize: 12,
		marginLeft: 8,
		...sharedStyles.textBold,
		color: theme.colors.fontHint
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
		backgroundColor: theme.colors.surfaceNeutral,
		flexDirection: 'row',
		alignItems: 'center',
		paddingLeft: 16
	},
	callToActionButtonText: {
		fontSize: 12,
		...sharedStyles.textSemibold,
		color: theme.colors.fontWhite
	},
	callToActionCallBackText: {
		fontSize: 12,
		...sharedStyles.textSemibold,
		color: theme.colors.surfaceDark
	},
	callToActionButton: {
		backgroundColor: theme.colors.badgeBackgroundLevel2,
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
		color: theme.colors.fontDefault,
		marginLeft: 8
	},
	plusUsers: {
		width: 28,
		height: 28,
		backgroundColor: theme.colors.surfaceNeutral,
		borderRadius: 4,
		alignItems: 'center',
		justifyContent: 'center'
	},
	plusUsersText: {
		fontSize: 14,
		...sharedStyles.textSemibold,
		color: theme.colors.fontDefault,
		alignSelf: 'center'
	},
	callBack: {
		fontSize: 12,
		...sharedStyles.textRegular,
		color: theme.colors.fontDefault
	},
	callToActionCallBack: {
		backgroundColor: theme.colors.surfaceSelected,
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
		color: theme.colors.strokeDark
	},
	enabledBackground: {
		backgroundColor: theme.colors.strokeHighlight
	}
}));
