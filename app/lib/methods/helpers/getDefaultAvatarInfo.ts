import { store } from '../../store/auxStore';

// Borrowed from https://github.com/RocketChat/Rocket.Chat/blob/a4f2102af1c2e875c60cafebd0163105bdaca678/apps/meteor/server/routes/avatar/utils.ts#L133

const colors = ['#158D65', '#7F1B9F', '#B68D00', '#E26D0E', '#10529E', '#6C727A'];
const MAX_SVG_AVATAR_INITIALS = 3;
const getAvatarBackgroundColor = (name: string): string => colors[name.length % colors.length];
const getAvatarFirstLetter = (name: string) =>
	name
		.replace(/[^A-Za-z0-9]/g, '')
		.substr(0, 1)
		.toUpperCase();
const getInitials = (name: string) => name.split(' ').slice(0, MAX_SVG_AVATAR_INITIALS).map(getAvatarBackgroundColor).join('');

export const getDefaultAvatarInfo = (username: string | undefined) => {
	if (!username) return;
	const { UI_Use_Name_Avatar } = store.getState().settings;

	return {
		backgroundColor: getAvatarBackgroundColor(username),
		firstLetter: !UI_Use_Name_Avatar ? getAvatarFirstLetter(username) : getInitials(username),
		username
	};
};
