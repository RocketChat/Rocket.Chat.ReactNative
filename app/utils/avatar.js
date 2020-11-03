import semver from 'semver';

import reduxStore from '../lib/createStore';

const formatUrl = (url, size, query) => `${ url }?format=png&size=${ size }${ query }`;

export const avatarURL = ({
	type, text, size, user = {}, avatar, server, avatarETag, rid, blockUnauthenticatedAccess
}) => {
	const { version: serverVersion } = reduxStore.getState().server;
	const isLegacy = serverVersion && semver.lt(semver.coerce(serverVersion), '3.6.0');

	let room;
	if (type === 'd') {
		room = text;
	} else if (rid && !isLegacy) {
		room = `room/${ rid }`;
	} else {
		room = `@${ text }`;
	}

	const uriSize = size > 100 ? size : 100;

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

		return formatUrl(`${ server }${ avatar }`, uriSize, query);
	}

	return formatUrl(`${ server }/avatar/${ room }`, uriSize, query);
};
