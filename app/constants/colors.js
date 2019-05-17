import { isIOS } from '../utils/deviceInfo';

export const COLOR_DANGER = '#f5455c';
export const COLOR_SUCCESS = '#2de0a5';
export const COLOR_PRIMARY = '#1d74f5';
export const COLOR_WHITE = '#fff';
export const COLOR_BUTTON_PRIMARY = COLOR_PRIMARY;
export const COLOR_TITLE = '#0C0D0F';
export const COLOR_TEXT = '#2F343D';
export const COLOR_TEXT_DESCRIPTION = '#9ca2a8';
export const COLOR_SEPARATOR = '#A7A7AA';
export const COLOR_BACKGROUND_CONTAINER = '#f3f4f5';
export const COLOR_BORDER = '#e1e5e8';
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
