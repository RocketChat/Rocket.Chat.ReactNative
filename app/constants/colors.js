import { isIOS } from '../utils/deviceInfo';

export const COLOR_DANGER = '#f5455c';
export const COLOR_BUTTON_PRIMARY = '#1d74f5';
export const COLOR_TEXT = '#292E35';
export const COLOR_SEPARATOR = '#A7A7AA';
export const STATUS_COLORS = {
	online: '#2de0a5',
	busy: COLOR_DANGER,
	away: '#ffd21f',
	offline: '#cbced1'
};

export const HEADER_BACKGROUND = isIOS ? '#f8f8f8' : '#2F343D';
export const HEADER_TITLE = isIOS ? '#0C0D0F' : '#FFF';
export const HEADER_BACK = isIOS ? '#1d74f5' : '#FFF';
