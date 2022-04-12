import { SubscriptionType } from '../definitions/ISubscription';
import { IAvatar } from '../containers/Avatar/interfaces';
import { compareServerVersion } from '../lib/methods/helpers/compareServerVersion';

const formatUrl = (url: string, size: number, query?: string) => `${url}?format=png&size=${size}${query}`;

export const avatarURL = ({
	type,
	text,
	size = 25,
	user = {},
	avatar,
	server,
	avatarETag,
	rid,
	blockUnauthenticatedAccess,
	serverVersion,
	externalProviderUrl
}: IAvatar): string => {
	let room;
	if (type === SubscriptionType.DIRECT) {
		room = text;
		if (externalProviderUrl) {
			const externalUri = externalProviderUrl.trim().replace(/\/+$/, '').replace('{username}', room);
			return formatUrl(`${externalUri}`, size);
		}
	} else if (rid && !compareServerVersion(serverVersion, 'lowerThan', '3.6.0')) {
		room = `room/${rid}`;
	} else {
		room = `@${text}`;
	}

	const { id, token } = user;
	let query = '';
	if (id && token && blockUnauthenticatedAccess) {
		query += `&rc_token=${token}&rc_uid=${id}`;
	}
	if (avatarETag) {
		query += `&etag=${avatarETag}`;
	}

	if (avatar) {
		if (avatar.startsWith('http')) {
			return avatar;
		}

		return formatUrl(`${server}${avatar}`, size, query);
	}

	return formatUrl(`${server}/avatar/${room}`, size, query);
};
