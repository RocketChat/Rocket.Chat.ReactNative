const formatUrl = (url, baseUrl, uriSize, avatarAuthURLFragment) => (
	`${ baseUrl }${ url }?format=png&size=${ uriSize }&${ avatarAuthURLFragment }`
);

export const avatarURL = ({
	type, text, size, userId, token, avatar, baseUrl
}) => {
	const room = type === 'd' ? text : `@${ text }`;

	// Avoid requesting several sizes by having only two sizes on cache
	const uriSize = size === 100 ? 100 : 50;

	let avatarAuthURLFragment = '';
	if (userId && token) {
		avatarAuthURLFragment = `&rc_token=${ token }&rc_uid=${ userId }`;
	}


	let uri;
	if (avatar) {
		uri = avatar.includes('http') ? avatar : formatUrl(avatar, baseUrl, uriSize, avatarAuthURLFragment);
	} else {
		uri = formatUrl(`/avatar/${ room }`, baseUrl, uriSize, avatarAuthURLFragment);
	}

	return uri;
};
