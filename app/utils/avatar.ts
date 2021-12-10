import { compareServerVersion, methods } from '../lib/utils';
import { RoomType } from '../definitions/IRoom';

const formatUrl = (url: string, size: number, query: string) => `${url}?format=png&size=${size}${query}`;

interface IAvatarURL {
	type: string;
	text: string;
	size?: number;
	user: { id?: string; token?: string };
	avatar?: string;
	server: string;
	avatarETag: string;
	rid?: string;
	blockUnauthenticatedAccess: boolean;
	serverVersion: string;
}

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
	serverVersion
}: IAvatarURL): string => {
	let room;
	if (type === RoomType.DIRECT) {
		room = text;
	} else if (rid && !compareServerVersion(serverVersion, '3.6.0', methods.lowerThan)) {
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
