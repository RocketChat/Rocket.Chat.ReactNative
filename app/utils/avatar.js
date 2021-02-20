import { isServerVersionLowerThan } from '../lib/utils';

const formatUrl = (url, size, query) => `${ url }?format=png&size=${ size }${ query }`;

export const avatarURL = ({
	type, text, size, user = {}, avatar, server, avatarETag, rid, blockUnauthenticatedAccess, serverVersion
}) => {
	let room;
	if (type === 'd') {
		room = text;
	} else if (rid && !(isServerVersionLowerThan(serverVersion, '3.6.0'))) {
		room = `room/${ rid }`;
	} else {
		room = `@${ text }`;
	}

	const { id, token } = user;
	let query = '';
	if (id && token && blockUnauthenticatedAccess) {
		query += `&rc_token=${ token }&rc_uid=${ id }`;
	}
	if (avatarETag) {
		query += `&etag=${ avatarETag }`;
	}

	if (avatar) {
		if (avatar.startsWith('http')) {
			return avatar;
		}

		return formatUrl(`${ server }${ avatar }`, size, query);
	}

	return formatUrl(`${ server }/avatar/${ room }`, size, query);
};
