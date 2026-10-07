import { Platform } from 'react-native';

const backdropColor = '#000000';
const overlayBackground = 'rgba(31, 35, 41, 0.65)';

const light = {
	surfaceLight: '#FFFFFF',
	surfaceTint: '#F7F8FA',
	surfaceRoom: '#FFFFFF',
	surfaceNeutral: '#E4E7EA',
	surfaceDisabled: '#F7F8FA',
	surfaceHover: '#F2F3F5',
	surfaceSelected: '#D7DBE0',
	surfaceDark: '#1F2329',
	surfaceFeatured: '#5F1477',
	surfaceFeaturedHover: '#4A105D',

	strokeExtraLight: '#EBECEF',
	strokeLight: '#CBCED1',
	strokeMedium: '#9EA2A8',
	strokeDark: '#6C727A',
	strokeExtraDark: '#2F343D',
	strokeExtraLightHighlight: '#D1EBFE',
	strokeHighlight: '#156FF5',
	strokeExtraLightError: '#FFC1C9',
	strokeError: '#EC0D2A',

	fontWhite: '#FFFFFF',
	fontDisabled: '#CBCED1',
	fontAnnotation: '#9EA2A8',
	fontHint: '#6C727A',
	fontSecondaryInfo: '#6C727A',
	fontDefault: '#2F343D',
	fontTitlesLabels: '#1F2329',
	fontInfo: '#095AD2',
	fontDanger: '#D40C26',
	fontPureBlack: '#2F343D',
	fontPureWhite: '#FFFFFF',

	statusBackgroundInfo: '#D1EBFE',
	statusBackgroundSuccess: '#C0F6E4',
	statusBackgroundDanger: '#FFC1C9',
	statusBackgroundWarning: '#FFECAD',
	statusBackgroundWarning2: '#FFF6D6',
	statusBackgroundService: '#FAD1B0',
	statusBackgroundService2: '#EDD0F7',
	statusFontInfo: '#095AD2',
	statusFontSuccess: '#148660',
	statusFontDanger: '#9B1325',
	statusFontWarning: '#8E6300',
	statusFontWarning2: '#2F343D',
	statusFontService: '#974809',
	statusFontService2: '#7F1B9F',

	badgeBackgroundLevel1: '#6C727A',
	badgeBackgroundLevel2: '#1D74F5',
	badgeBackgroundLevel3: '#F38C39',
	badgeBackgroundLevel4: '#F5455C',

	userPresenceOnline: '#158D65',
	userPresenceBusy: '#D40C26',
	userPresenceAway: '#AC892F',
	userPresenceOffline: '#6C727A',
	userPresenceDisabled: '#F38C39',

	buttonBackgroundPrimaryDefault: '#156FF5',
	buttonBackgroundPrimaryPress: '#10529E',
	buttonBackgroundPrimaryDisabled: '#D1EBFE',

	buttonBackgroundSecondaryDefault: '#E4E7EA',
	buttonBackgroundSecondaryPress: '#9EA2A8',
	buttonBackgroundSecondaryDisabled: '#EEEFF1',

	buttonBackgroundSecondaryDangerDefault: '#E4E7EA',
	buttonBackgroundSecondaryDangerPress: '#9EA2A8',
	buttonBackgroundSecondaryDangerDisabled: '#EEEFF1',

	buttonBackgroundDangerDefault: '#EC0D2A',
	buttonBackgroundDangerPress: '#BB0B21',
	buttonBackgroundDangerDisabled: '#FFC1C9',

	buttonBackgroundSuccessDefault: '#158D65',
	buttonBackgroundSuccessPress: '#0D5940',
	buttonBackgroundSuccessDisabled: '#C0F6E4',

	buttonFontPrimary: '#FFFFFF',
	buttonPrimaryDisabled: '#FFFFFF',
	buttonFontSecondary: '#1F2329',
	buttonSecondaryDisabled: '#CBCED1',
	buttonFontSecondaryDanger: '#BB0B21',
	buttonSecondaryDangerDisabled: '#F98F9D',
	buttonFontDanger: '#FFFFFF',
	buttonDangerDisabled: '#FFFFFF',
	buttonFontSuccess: '#FFFFFF',
	buttonSuccessDisabled: '#FFFFFF'
};

const dark = {
	surfaceLight: '#262931',
	surfaceTint: '#1F2329',
	surfaceRoom: '#1F2329',
	surfaceNeutral: '#2D3039',
	surfaceDisabled: '#24272E',
	surfaceHover: '#1A1E23',
	surfaceSelected: '#3C3F44',
	surfaceDark: '#E4E7EA',
	surfaceFeatured: '#5F1477',
	surfaceFeaturedHover: '#4A105D',

	strokeExtraLight: '#2F343D',
	strokeLight: '#333842',
	strokeMedium: '#404754',
	strokeDark: '#1F2329',
	strokeExtraDark: '#CBCED1',
	strokeExtraLightHighlight: '#87CBFC',
	strokeHighlight: '#3976D1',
	strokeExtraLightError: '#F49AA6',
	strokeError: '#BB3E4E',

	fontWhite: '#FFFFFF',
	fontDisabled: '#60646C',
	fontAnnotation: '#9EA2A8',
	fontHint: '#9EA2A8',
	fontSecondaryInfo: '#9EA2A8',
	fontDefault: '#C1C7D0',
	fontTitlesLabels: '#F2F3F5',
	fontInfo: '#739EDE',
	fontDanger: '#CF6E7A',
	fontPureBlack: '#2F343D',
	fontPureWhite: '#FFFFFF',

	statusBackgroundInfo: '#A8C3EB',
	statusBackgroundSuccess: '#C1EBDD',
	statusBackgroundDanger: '#FFBDC5',
	statusBackgroundWarning: '#FEEFBE',
	statusBackgroundWarning2: '#4E4731',
	statusBackgroundService: '#FCE3CF',
	statusBackgroundService2: '#EDD0F7',
	statusFontInfo: '#739EDE',
	statusFontSuccess: '#58AD90',
	statusFontDanger: '#D88892',
	statusFontWarning: '#C7AA66',
	statusFontWarning2: '#FFFFFF',
	statusFontService: '#CA9163',
	statusFontService2: '#C393D2',

	badgeBackgroundLevel1: '#484C51',
	badgeBackgroundLevel2: '#2C65BA',
	badgeBackgroundLevel3: '#955828',
	badgeBackgroundLevel4: '#B43C4C',

	userPresenceOnline: '#1CBF89',
	userPresenceBusy: '#C75765',
	userPresenceAway: '#AC892F',
	userPresenceOffline: '#6C727A',
	userPresenceDisabled: '#955828',

	buttonBackgroundPrimaryDefault: '#095AD2',
	buttonBackgroundPrimaryPress: '#245399',
	buttonBackgroundPrimaryDisabled: '#1D3963',

	buttonBackgroundSecondaryDefault: '#353B45',
	buttonBackgroundSecondaryPress: '#454C59',
	buttonBackgroundSecondaryDisabled: '#2F343D',

	buttonBackgroundSecondaryDangerDefault: '#2F343D',
	buttonBackgroundSecondaryDangerPress: '#454C59',
	buttonBackgroundSecondaryDangerDisabled: '#2F343D',

	buttonBackgroundDangerDefault: '#BB3E4E',
	buttonBackgroundDangerPress: '#822C37',
	buttonBackgroundDangerDisabled: '#3D2126',

	buttonBackgroundSuccessDefault: '#1D7256',
	buttonBackgroundSuccessPress: '#134937',
	buttonBackgroundSuccessDisabled: '#1E4B40',

	buttonFontPrimary: '#FFFFFF',
	buttonPrimaryDisabled: '#6C727A',
	buttonFontSecondary: '#E4E7EA',
	buttonSecondaryDisabled: '#6C727A',
	buttonFontSecondaryDanger: '#C14454',
	buttonSecondaryDangerDisabled: '#613339',
	buttonFontDanger: '#FFFFFF',
	buttonDangerDisabled: '#757575',
	buttonFontSuccess: '#FFFFFF',
	buttonSuccessDisabled: '#757575'
};

const blackAndroid = {
	...dark,
	surfaceTint: '#16181a',
	surfaceRoom: '#000000',
	surfaceHover: '#080808'
};

const blackIOS = {
	...dark,
	surfaceLight: '#161717',
	surfaceTint: '#0A0A0A',
	surfaceRoom: '#0A0A0A',
	surfaceNeutral: '#161717',
	surfaceDisabled: '#121313',
	surfaceHover: '#0A0A0A',
	surfaceSelected: '#2A2B2B',
	surfaceDark: '#E4E4E4',

	strokeExtraLight: '#2D2E2E',
	strokeLight: '#2D2E2E',
	strokeMedium: '#646565',
	strokeDark: '#161717',
	strokeExtraDark: '#CCCCCC',
	strokeHighlight: '#156FF5',

	fontDisabled: '#5C5C5C',
	fontAnnotation: '#949393',
	fontHint: '#949393',
	fontSecondaryInfo: '#949393',
	fontDefault: '#E4E4E4',
	fontTitlesLabels: '#FAFAFA',

	badgeBackgroundLevel1: '#484848',
	badgeBackgroundLevel2: '#156FF5',

	userPresenceOffline: '#8A8A8A',

	buttonBackgroundPrimaryDefault: '#156FF5',
	buttonBackgroundPrimaryPress: '#10529E',

	buttonBackgroundSecondaryDefault: '#292929',
	buttonBackgroundSecondaryPress: '#3A3B3B',
	buttonBackgroundSecondaryDisabled: '#1D1E1E',

	buttonBackgroundSecondaryDangerDefault: '#292929',
	buttonBackgroundSecondaryDangerPress: '#3A3B3B',
	buttonBackgroundSecondaryDangerDisabled: '#1D1E1E',

	buttonPrimaryDisabled: '#8A8A8A',
	buttonFontSecondary: '#E4E4E4',
	buttonSecondaryDisabled: '#6D6D6D',
	buttonFontSecondaryDanger: '#D88892'
};

const black = Platform.OS === 'ios' ? blackIOS : blackAndroid;

export const colors = {
	light: {
		...light,
		backdropColor,
		overlayBackground,
		backdropOpacity: 0.3,
		attachmentLoadingOpacity: 0.7
	},
	dark: {
		...dark,
		backdropColor,
		overlayBackground,
		backdropOpacity: 0.9,
		attachmentLoadingOpacity: 0.3
	},
	black: {
		...black,
		backdropColor,
		overlayBackground,
		backdropOpacity: 0.9,
		attachmentLoadingOpacity: 0.3
	}
};

export const themes = colors;
