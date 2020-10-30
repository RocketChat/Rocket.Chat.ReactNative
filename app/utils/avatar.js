const formatUrl = (url, size, query) => `${ url }?format=png&size=${ size }${ query }`;

export const avatarURL = ({
	type, text, size, user = {}, avatar, server, avatarETag
}) => {
	const room = type === 'd' ? text : `@${ text }`;

	// Avoid requesting several sizes by having only two sizes on cache
	const uriSize = size === 100 ? 100 : 50;

	const { id, token } = user;
	let query = '';
	if (id && token) {
		query += `&rc_token=${ token }&rc_uid=${ id }`;
	}
	if (avatarETag) {
		query += `&etag=${ avatarETag }`;
	}

	if (avatar) {
		if (avatar.startsWith('http')) {
			return avatar;
		}

		return formatUrl(`${ server }${ avatar }`, uriSize, query);
	}

	return formatUrl(`${ server }/avatar/${ room }`, uriSize, query);
};
