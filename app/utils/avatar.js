import semver from 'semver';
import store from '../lib/createStore';

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

	const serverVersion = store.getState().server.version;
	const { Accounts_AvatarBlockUnauthenticatedAccess } = store.getState().settings;
	// if server version is less than 3.5.0, always send auth, since Accounts_AvatarBlockUnauthenticatedAccess isn't public
	const shouldSendAuth = (serverVersion && semver.lt(semver.coerce(serverVersion), '3.5.0')) || Accounts_AvatarBlockUnauthenticatedAccess;
	if (userId && token && shouldSendAuth) {
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
