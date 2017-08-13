import { AVATAR_COLORS } from '../constants/colors';

export default function(username = '') {
	const position = username.length % AVATAR_COLORS.length;

	const color = AVATAR_COLORS[position];
	username = username.replace(/[^A-Za-z0-9]/g, '.').replace(/\.+/g, '.').replace(/(^\.)|(\.$)/g, '');

	const usernameParts = username.split('.');

	let initials = usernameParts.length > 1 ? usernameParts[0][0] + usernameParts[usernameParts.length - 1][0] : username.replace(/[^A-Za-z0-9]/g, '').substr(0, 2);
	initials = initials.toUpperCase();

	return { initials, color };
}
