import { PixelRatio } from 'react-native';

import { SubscriptionType } from '../../../definitions';
import { type IAvatar } from '../../../containers/Avatar/interfaces';
import { compareServerVersion } from './compareServerVersion';

export const formatUrl = (url: string, size: number, query?: string) => {
	const hasQuestionMark = /\/[^\/?]+\?/.test(url);
	return `${url}${hasQuestionMark ? '&' : '?'}format=png&size=${PixelRatio.get() * size}${query || ''}`;
};

export const getAvatarURL = ({
	type,
	text = '',
	size = 25,
	userId,
	token,
	avatar,
	server,
	avatarETag,
	rid,
	blockUnauthenticatedAccess,
	serverVersion,
	avatarExternalProviderUrl,
	roomAvatarExternalProviderUrl,
	cdnPrefix
}: IAvatar): string => {
	if (!!avatar && avatar?.startsWith('data:')) {
		return avatar;
	}
	// Servers >= 6.12.0 proxy external-provider avatars through /avatar themselves (RC #32824),
	// so we only build the external URL client-side for older servers that lack that proxy.
	const serverLacksExternalAvatarProxy = compareServerVersion(serverVersion, 'lowerThan', '6.12.0');
	let room;
	if (type === SubscriptionType.DIRECT) {
		room = text;
		if (avatarExternalProviderUrl && serverLacksExternalAvatarProxy) {
			const externalUri = avatarExternalProviderUrl.trim().replace(/\/+$/, '').replace('{username}', room);
			return formatUrl(`${externalUri}`, size);
		}
	} else if (
		rid &&
		roomAvatarExternalProviderUrl &&
		serverLacksExternalAvatarProxy &&
		compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '3.8.0')
	) {
		const externalUri = roomAvatarExternalProviderUrl.trim().replace(/\/+$/, '').replace('{roomId}', rid);
		return formatUrl(`${externalUri}`, size);
	} else if (rid && !compareServerVersion(serverVersion, 'lowerThan', '3.6.0')) {
		room = `room/${rid}`;
	} else {
		room = `@${text}`;
	}

	let query = '';
	if (userId && token && blockUnauthenticatedAccess) {
		query += `&rc_token=${token}&rc_uid=${userId}`;
	}
	if (avatarETag) {
		query += `&etag=${avatarETag}`;
	}

	cdnPrefix = cdnPrefix?.trim();
	if (cdnPrefix && cdnPrefix.startsWith('http')) {
		server = cdnPrefix.replace(/\/+$/, '');
	}

	if (avatar) {
		if (avatar.startsWith('http')) {
			return avatar;
		}

		return formatUrl(`${server}${avatar}`, size, query);
	}

	return formatUrl(`${server}/avatar/${room}`, size, query);
};
