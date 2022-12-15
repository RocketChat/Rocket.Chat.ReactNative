export const STATUS_COLORS: any = {
	online: '#2de0a5',
	busy: '#f5455c',
	away: '#ffd21f',
	offline: '#cbced1',
	loading: '#9ea2a8'
};

export const SWITCH_TRACK_COLOR = {
	false: '#f5455c',
	true: '#2de0a5'
};

const mentions = {
	unreadColor: '#6C727A',
	tunreadColor: '#1d74f5',
	mentionMeColor: '#F5455C',
	mentionGroupColor: '#F38C39',
	mentionOtherColor: '#F3BE08'
};

export const colors = {
	light: {
		backgroundColor: '#ffffff', // surface-light
		// focusedBackground: '#ffffff', // removed in favor of backgroundColor
		// chatComponentBackground: 'red',
		surfaceTint: '#F7F8FA',
		buttonBackgroundSecondaryDefault: '#E4E7EA',
		buttonBackgroundSecondaryPress: '#9EA2A8',
		statusBackgroundWarning: '#FFECAD',
		// auxiliaryBackground: '#efeff4', // removed in favor of backgroundColor
		// bannerBackground: '#f1f2f4', // removed in favor of buttonBackgroundSecondaryPress
		titleText: '#1F2329', // fontTitleLabels
		bodyText: '#2F343D', // fontDefault
		auxiliaryText: '#6C727A', // fontSecondaryInfo
		// controlText: '#54585e', // removed in favor of auxiliaryText
		// infoText: '#6d6d72', // removed in favor of auxiliaryText
		separatorColor: '#CBCED1', // strokeLight
		tintColor: '#156FF5', // buttonBackgroundPrimaryDefault
		// tintColor: '#549df9', // removed in favor of tintColor
		// actionTintColor: '#1d74f5', // removed in favor of tintColor
		tintDisabled: '#D1EBFE', // buttonBackgroundDisabled
		// auxiliaryTintColor: '#6C727A', // removed in favor of auxiliaryText
		backdropOpacity: 0.7,
		dangerColor: '#EC0D2A', // buttonBackgroundDangerDefault
		// successColor: '#2de0a5', not used
		borderColor: '#9EA2A8', // strokeMedium
		navbarBackground: '#F7F8FA', // surfaceTint
		headerBorder: '#CBCED1', // strokeLight
		headerBackground: '#F7F8FA', // surfaceTint
		// headerSecondaryBackground: '#ffffff', removed in favor of headerBackground
		headerTintColor: '#6C727A', // fontSecondaryInfo
		headerTitleColor: '#1F2329', // fontTitleLabels
		// headerSecondaryText: '#1d74f5', not used
		toastBackground: '#0C0D0F', // strokeExtraDark
		videoBackground: '#0C0D0F', // strokeExtraDark
		favoriteBackground: '#ffbb00', // tbd
		hideBackground: '#54585e', // tbd
		messageboxBackground: '#F7F8FA', // surfaceTint
		// searchboxBackground: '#E6E6E7', removed in favor of buttonBackgroundSecondaryDefault
		// buttonBackground: '#414852', buttonBackgroundSecondaryDefault
		buttonText: '#ffffff', // buttonFontOnPrimary
		passcodeBackground: '#F7F8FA', // surfaceTint
		passcodeButtonActive: '#9EA2A8', // buttonBackgroundSecondaryPress
		passcodeLockIcon: '#1F2329', // fontTitleLabels
		passcodePrimary: '#1F2329', // fontTitleLabels
		passcodeSecondary: '#6C727A', // fontSecondaryInfo
		passcodeDotEmpty: '#CBCED1', // surfaceLight
		passcodeDotFull: '#9EA2A8', // surfaceMedium
		previewBackground: '#0C0D0F', // strokeExtraDark
		previewTintColor: '#ffffff', // buttonFontOnPrimary change later
		attachmentLoadingOpacity: 0.7, // tbd
		collapsibleQuoteBorder: '#CBCED1', // strokeLight
		collapsibleChevron: '#6C727A', // fontSecondaryInfo
		cancelButton: '#E4E7EA', // buttonBackgroundSecondaryDefault
		conferenceCallBorder: '#F2F3F5',
		conferenceCallBackground: '#F7F8FA',
		conferenceCallOngoingPhoneBackground: '#C0F6E4',
		conferenceCallIncomingPhoneBackground: '#D1EBFE',
		conferenceCallEndedPhoneBackground: '#E4E7EA',
		conferenceCallOngoingPhoneIcon: '#158D65',
		conferenceCallIncomingPhoneIcon: '#095AD2',
		conferenceCallEndedPhoneIcon: '#6C727A',
		conferenceCallPlusUsersButton: '#E4E7EA',
		conferenceCallPlusUsersText: '#6C727A',
		conferenceCallCallBackButton: '#EEEFF1',
		conferenceCallCallBackText: '#1F2329',
		conferenceCallDisabledIcon: '#6C727A',
		conferenceCallEnabledIcon: '#FFFFFF',
		conferenceCallEnabledIconBackground: '#156FF5',
		conferenceCallPhotoBackground: '#E4E7EA',
		textInputSecondaryBackground: '#E4E7EA',
		...mentions
	},
	dark: {
		backgroundColor: '#030b1b',
		focusedBackground: '#0b182c',
		chatComponentBackground: '#192132',
		auxiliaryBackground: '#07101e',
		bannerBackground: '#0e1f38',
		titleText: '#f9f9f9',
		bodyText: '#cbced1',
		backdropColor: '#000000',
		dangerColor: '#f5455c',
		successColor: '#2de0a5',
		borderColor: '#0f213d',
		controlText: '#dadde6',
		auxiliaryText: '#9297a2',
		infoText: '#6D6D72',
		tintColor: '#1d74f5',
		// tintColor: '#549df9',
		tintDisabled: '#88B4F5',
		auxiliaryTintColor: '#f9f9f9',
		actionTintColor: '#1d74f5',
		separatorColor: '#2b2b2d',
		navbarBackground: '#0b182c',
		headerBorder: '#2F3A4B',
		headerBackground: '#0b182c',
		headerSecondaryBackground: '#0b182c',
		headerTintColor: '#f9f9f9',
		headerTitleColor: '#f9f9f9',
		headerSecondaryText: '#9297a2',
		toastBackground: '#0C0D0F',
		videoBackground: '#1f2329',
		favoriteBackground: '#ffbb00',
		hideBackground: '#54585e',
		messageboxBackground: '#0b182c',
		searchboxBackground: '#192d4d',
		buttonBackground: '#414852',
		buttonText: '#ffffff',
		passcodeBackground: '#030C1B',
		passcodeButtonActive: '#0B182C',
		passcodeLockIcon: '#6C727A',
		passcodePrimary: '#FFFFFF',
		passcodeSecondary: '#CBCED1',
		passcodeDotEmpty: '#CBCED1',
		passcodeDotFull: '#6C727A',
		previewBackground: '#030b1b',
		previewTintColor: '#f9f9f9',
		backdropOpacity: 0.9,
		attachmentLoadingOpacity: 0.3,
		collapsibleQuoteBorder: '#CBCED1',
		collapsibleChevron: '#6C727A',
		cancelButton: '#E4E7EA',
		conferenceCallBorder: '#1F2329',
		conferenceCallBackground: '#1F2329',
		conferenceCallOngoingPhoneBackground: '#106D4F',
		conferenceCallIncomingPhoneBackground: '#D1EBFE',
		conferenceCallEndedPhoneBackground: '#6C727A',
		conferenceCallOngoingPhoneIcon: '#F7F8FA',
		conferenceCallIncomingPhoneIcon: '#095AD2',
		conferenceCallEndedPhoneIcon: '#F7F8FA',
		conferenceCallPlusUsersButton: '#2F343D',
		conferenceCallPlusUsersText: '#9EA2A8',
		conferenceCallCallBackButton: '#E4E7EA',
		conferenceCallCallBackText: '#FFFFFF',
		conferenceCallDisabledIcon: '#6C727A',
		conferenceCallEnabledIcon: '#FFFFFF',
		conferenceCallEnabledIconBackground: '#156FF5',
		conferenceCallPhotoBackground: '#E4E7EA',
		textInputSecondaryBackground: '#030b1b', // backgroundColor
		...mentions
	},
	black: {
		backgroundColor: '#000000',
		focusedBackground: '#0d0d0d',
		chatComponentBackground: '#16181a',
		auxiliaryBackground: '#080808',
		bannerBackground: '#1f2329',
		titleText: '#f9f9f9',
		bodyText: '#cbced1',
		backdropColor: '#000000',
		dangerColor: '#f5455c',
		successColor: '#2de0a5',
		borderColor: '#1f2329',
		controlText: '#dadde6',
		auxiliaryText: '#b2b8c6',
		infoText: '#6d6d72',
		tintColor: '#1e9bfe',
		// tintColor: '#76b7fc',
		tintDisabled: '#88B4F5', // TODO: Evaluate this with design team
		auxiliaryTintColor: '#f9f9f9',
		actionTintColor: '#1e9bfe',
		separatorColor: '#272728',
		navbarBackground: '#0d0d0d',
		headerBorder: '#323232',
		headerBackground: '#0d0d0d',
		headerSecondaryBackground: '#0d0d0d',
		headerTintColor: '#f9f9f9',
		headerTitleColor: '#f9f9f9',
		headerSecondaryText: '#b2b8c6',
		toastBackground: '#0C0D0F',
		videoBackground: '#1f2329',
		favoriteBackground: '#ffbb00',
		hideBackground: '#54585e',
		messageboxBackground: '#0d0d0d',
		searchboxBackground: '#1f1f1f',
		buttonBackground: '#414852',
		buttonText: '#ffffff',
		passcodeBackground: '#000000',
		passcodeButtonActive: '#0E0D0D',
		passcodeLockIcon: '#6C727A',
		passcodePrimary: '#FFFFFF',
		passcodeSecondary: '#CBCED1',
		passcodeDotEmpty: '#CBCED1',
		passcodeDotFull: '#6C727A',
		previewBackground: '#000000',
		previewTintColor: '#f9f9f9',
		backdropOpacity: 0.9,
		attachmentLoadingOpacity: 0.3,
		collapsibleQuoteBorder: '#CBCED1',
		collapsibleChevron: '#6C727A',
		cancelButton: '#E4E7EA',
		conferenceCallBorder: '#1F2329',
		conferenceCallBackground: '#1F2329',
		conferenceCallOngoingPhoneBackground: '#106D4F',
		conferenceCallIncomingPhoneBackground: '#D1EBFE',
		conferenceCallEndedPhoneBackground: '#6C727A',
		conferenceCallOngoingPhoneIcon: '#F7F8FA',
		conferenceCallIncomingPhoneIcon: '#095AD2',
		conferenceCallEndedPhoneIcon: '#F7F8FA',
		conferenceCallPlusUsersButton: '#2F343D',
		conferenceCallPlusUsersText: '#9EA2A8',
		conferenceCallCallBackButton: '#E4E7EA',
		conferenceCallCallBackText: '#FFFFFF',
		conferenceCallDisabledIcon: '#6C727A',
		conferenceCallEnabledIcon: '#FFFFFF',
		conferenceCallEnabledIconBackground: '#156FF5',
		conferenceCallPhotoBackground: '#E4E7EA',
		textInputSecondaryBackground: '#000000', // backgroundColor
		...mentions
	}
};

export const themes = colors;
