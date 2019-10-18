import { isIOS, isAndroid } from '../utils/deviceInfo';

export const COLOR_DANGER = '#f5455c';
export const COLOR_SUCCESS = '#2de0a5';
export const COLOR_PRIMARY = '#1d74f5';
export const COLOR_WHITE = '#fff'; // KEEP
export const COLOR_BLACK = '#000000'; // KEEP
export const COLOR_BUTTON_PRIMARY = COLOR_PRIMARY;
export const COLOR_TITLE = '#0C0D0F';
export const COLOR_TEXT = '#2F343D';
export const COLOR_TEXT_DESCRIPTION = '#9ca2a8';
export const COLOR_SEPARATOR = '#A7A7AA';
export const COLOR_BACKGROUND_CONTAINER = '#f3f4f5';
export const COLOR_BACKGROUND_NOTIFICATION = '#f8f8f8';
export const COLOR_BORDER = 'red';
export const COLOR_UNREAD = '#e1e5e8';
export const COLOR_TOAST = '#0C0D0F';
export const STATUS_COLORS = {
	online: '#2de0a5',
	busy: COLOR_DANGER,
	away: '#ffd21f',
	offline: '#cbced1'
};

export const HEADER_BACKGROUND = isIOS ? '#f8f8f8' : '#2F343D';
export const HEADER_TITLE = isIOS ? COLOR_TITLE : COLOR_WHITE;
export const HEADER_BACK = isIOS ? COLOR_PRIMARY : COLOR_WHITE;
export const HEADER_TINT = isIOS ? COLOR_PRIMARY : COLOR_WHITE;

export const SWITCH_TRACK_COLOR = {
	false: isAndroid ? COLOR_DANGER : null,
	true: COLOR_SUCCESS
};


export const themes = {
	light: {
		backgroundColor: '#ffffff',
		focusedBackground: isIOS ? '#f8f8f8' : '#2f343d',
		chatComponentBackground: '#f3f4f5',
		auxiliaryBackground: '#eeeef4',
		bannerBackground: '#f1f2f4',
		titleText: '#0d0e12',
		bodyText: '#2f343d',
		borderColor: '#e1e5e8',
		controlText: '#54585e',
		auxiliaryText: '#9ca2a8',
		tintColor: '#1d74f5',
		auxiliaryTintColor: '#0a4469',
		actionTintColor: '#1d74f5',
		actionBackgroundColor: '#e8f2ff',
		mutedAccent: '#cbcbcc',
		strongAccent: '', // ???
		separatorColor: '#A7A7AA'
	},
	dark: {
		backgroundColor: '#030b1b',
		focusedBackground: '#0b182c',
		chatComponentBackground: '#192132',
		auxiliaryBackground: '#07101e',
		bannerBackground: '#0e1f38',
		titleText: '#FFFFFF',
		bodyText: '#e8ebed',
		borderColor: '#0f213d',
		controlText: '#dadde6',
		auxiliaryText: '#9297a2',
		tintColor: '#1d74f5',
		auxiliaryTintColor: '#cdcdcd',
		actionTintColor: '#1d74f5',
		actionBackgroundColor: '#e8f2ff',
		mutedAccent: '#2a2a2d',
		strongAccent: '', // ???
		separatorColor: '#A7A7AA'
	},
	black: {
		backgroundColor: '#000000',
		focusedBackground: '#0d0d0d',
		chatComponentBackground: '#16181a',
		auxiliaryBackground: '#080808',
		bannerBackground: '#1f2329',
		titleText: '#f9f9f9',
		bodyText: '#e8ebed',
		borderColor: '#1f2329',
		controlText: '#dadde6',
		auxiliaryText: '#b2b8c6',
		tintColor: '#1e9bfe',
		auxiliaryTintColor: '#cdcdcd',
		actionTintColor: '#1ea1fe',
		actionBackgroundColor: '#e8f2ff',
		mutedAccent: '#282828',
		strongAccent: '', // ???
		separatorColor: '#A7A7AA'
	}
};
