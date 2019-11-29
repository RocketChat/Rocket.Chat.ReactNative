import { isIOS, isAndroid } from '../utils/deviceInfo';

export const COLOR_DANGER = '#f5455c';
export const COLOR_SUCCESS = '#4BD964';
export const COLOR_BLACK = '#000000'; // KEEP
export const STATUS_COLORS = {
	online: '#2de0a5',
	busy: COLOR_DANGER,
	away: '#ffd21f',
	offline: '#cbced1'
};

export const SWITCH_TRACK_COLOR = {
	false: isAndroid ? COLOR_DANGER : null,
	true: COLOR_SUCCESS
};

export const themes = {
	light: {
		backgroundColor: '#ffffff',
		focusedBackground: '#ffffff',
		chatComponentBackground: '#f3f4f5',
		emptyChatBackground: '#f3f4f5',
		auxiliaryBackground: '#efeff4',
		bannerBackground: '#f1f2f4',
		titleText: '#0d0e12',
		bodyText: '#2f343d',
		borderColor: '#e1e5e8',
		controlText: '#54585e',
		auxiliaryText: '#9ca2a8',
		infoText: '#6d6d72',
		tintColor: '#1d74f5',
		auxiliaryTintColor: '#caced1',
		actionTintColor: '#1d74f5',
		separatorColor: '#cbcbcc',
		strongAccent: '', // ???
		navbarBackground: '#ffffff',
		headerBorder: '#B2B2B2',
		headerBackground: isIOS ? '#f8f8f8' : '#2f343d',
		headerSecondaryBackground: isAndroid ? '#54585e' : '#ffffff',
		headerTintColor: isAndroid ? '#ffffff' : '#1d74f5',
		headerTitleColor: isAndroid ? '#ffffff' : '#0d0e12',
		headerSecondaryText: isAndroid ? '#9ca2a8' : '#1d74f5',
		toastBackground: '#0C0D0F',
		videoBackground: '#1f2329',
		messageboxBackground: '#ffffff',
		searchboxBackground: '#E6E6E7',
		buttonText: '#ffffff'
	},
	dark: {
		backgroundColor: '#030b1b',
		focusedBackground: '#0b182c',
		chatComponentBackground: '#192132',
		emptyChatBackground: '#030A1A',
		auxiliaryBackground: '#07101e',
		bannerBackground: '#0e1f38',
		titleText: '#FFFFFF',
		bodyText: '#e8ebed',
		borderColor: '#0f213d',
		controlText: '#dadde6',
		auxiliaryText: '#9297a2',
		infoText: '#6D6D72',
		tintColor: '#1d74f5',
		auxiliaryTintColor: '#cdcdcd',
		actionTintColor: '#1d74f5',
		separatorColor: '#2b2b2d',
		strongAccent: '', // ???
		navbarBackground: '#0b182c',
		headerBorder: '#2F3A4B',
		headerBackground: '#0b182c',
		headerSecondaryBackground: '#0b182c',
		headerTintColor: isAndroid ? '#ffffff' : '#1d74f5',
		headerTitleColor: '#FFFFFF',
		headerSecondaryText: isAndroid ? '#9297a2' : '#1d74f5',
		toastBackground: '#0C0D0F',
		videoBackground: '#1f2329',
		messageboxBackground: '#0b182c',
		searchboxBackground: '#192d4d',
		buttonText: '#ffffff'
	},
	black: {
		backgroundColor: '#000000',
		focusedBackground: '#0d0d0d',
		chatComponentBackground: '#16181a',
		emptyChatBackground: '#000000',
		auxiliaryBackground: '#080808',
		bannerBackground: '#1f2329',
		titleText: '#f9f9f9',
		bodyText: '#e8ebed',
		borderColor: '#1f2329',
		controlText: '#dadde6',
		auxiliaryText: '#b2b8c6',
		infoText: '#6d6d72',
		tintColor: '#1e9bfe',
		auxiliaryTintColor: '#cdcdcd',
		actionTintColor: '#1ea1fe',
		separatorColor: '#272728',
		strongAccent: '', // ???
		navbarBackground: '#0d0d0d',
		headerBorder: '#323232',
		headerBackground: '#0d0d0d',
		headerSecondaryBackground: '#0d0d0d',
		headerTintColor: isAndroid ? '#ffffff' : '#1e9bfe',
		headerTitleColor: '#f9f9f9',
		headerSecondaryText: isAndroid ? '#b2b8c6' : '#1d74f5',
		toastBackground: '#0C0D0F',
		videoBackground: '#1f2329',
		messageboxBackground: '#0d0d0d',
		searchboxBackground: '#1f1f1f',
		buttonText: '#ffffff'
	}
};
