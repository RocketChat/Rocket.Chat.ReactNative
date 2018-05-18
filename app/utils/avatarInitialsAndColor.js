import { AVATAR_COLORS } from '../constants/colors';

export default function(username = '') {
	if (username === '') {
		return {
			initials: '',
			colors: 'transparent'
		};
	}
	const position = username.length % AVATAR_COLORS.length;

	const color = AVATAR_COLORS[position];
	const initials = username.replace(/[^A-Za-z0-9]/g, '').substr(0, 1).toUpperCase();

	return { initials, color };
}
