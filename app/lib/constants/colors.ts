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
	statusBackgroundWarning2: '#FFF8E0',
	statusBackgroundService: '#FAD1B0',
	statusBackgroundService2: '#EDD0F7',
	statusFontInfo: '#095AD2',
	statusFontSuccess: '#148660',
	statusFontDanger: '#9B1325',
	statusFontWarning: '#895F00',
	statusFontWarning2: '#2F343D',
	statusFontService: '#974809',
	statusFontService2: '#7F1B9F',

	badgeBackgroundLevel1: '#6C727A',
	badgeBackgroundLevel2: '#156FF5',
	badgeBackgroundLevel3: '#F38C39',
	badgeBackgroundLevel4: '#EC0D2A',

	userPresenceOnline: '#148660',
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

	buttonBackgroundSuccessDefault: '#148660',
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
	surfaceSelected: '#4C5362',
	surfaceDark: '#E4E7EA',
	surfaceFeatured: '#5F1477',
	surfaceFeaturedHover: '#4A105D',

	strokeExtraLight: '#333842',
	strokeLight: '#404754',
	strokeMedium: '#4B5362',
	strokeDark: '#9EA2A8',
	strokeExtraDark: '#CBCED1',
	strokeExtraLightHighlight: '#D1EBFE',
	strokeHighlight: '#6292DA',
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
	fontDanger: '#D88892',
	fontPureBlack: '#2F343D',
	fontPureWhite: '#FFFFFF',

	statusBackgroundInfo: '#A8C3EB',
	statusBackgroundSuccess: '#C1EBDD',
	statusBackgroundDanger: '#F7CFD4',
	statusBackgroundWarning: '#FEEFBE',
	statusBackgroundWarning2: '#3C3625',
	statusBackgroundService: '#FCE3CF',
	statusBackgroundService2: '#EDD0F7',
	statusFontInfo: '#8DB6FC',
	statusFontSuccess: '#58AD90',
	statusFontDanger: '#D88892',
	statusFontWarning: '#CFB26C',
	statusFontWarning2: '#FFFFFF',
	statusFontService: '#CA9163',
	statusFontService2: '#C393D2',

	badgeBackgroundLevel1: '#6C727A',
	badgeBackgroundLevel2: '#2C65BA',
	badgeBackgroundLevel3: '#955828',
	badgeBackgroundLevel4: '#B43C4C',

	userPresenceOnline: '#1CBF89',
	userPresenceBusy: '#C75765',
	userPresenceAway: '#B08C30',
	userPresenceOffline: '#8B9098',
	userPresenceDisabled: '#CC7F42',

	buttonBackgroundPrimaryDefault: '#095AD2',
	buttonBackgroundPrimaryPress: '#01336B',
	buttonBackgroundPrimaryDisabled: '#012247',

	buttonBackgroundSecondaryDefault: '#404754',
	buttonBackgroundSecondaryPress: '#575F70',
	buttonBackgroundSecondaryDisabled: '#404854',

	buttonBackgroundSecondaryDangerDefault: '#404754',
	buttonBackgroundSecondaryDangerPress: '#575F70',
	buttonBackgroundSecondaryDangerDisabled: '#404854',

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
	buttonFontSecondaryDanger: '#FFC1C9',
	buttonSecondaryDangerDisabled: '#6B0513',
	buttonFontDanger: '#FFFFFF',
	buttonDangerDisabled: '#757575',
	buttonFontSuccess: '#FFFFFF',
	buttonSuccessDisabled: '#757575'
};

const blackAndroid = {
	...dark,
	surfaceLight: '#0d0d0d',
	surfaceTint: '#16181a',
	surfaceRoom: '#000000',
	surfaceNeutral: '#16181a',
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
	surfaceDark: '#E4E4E4'
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
