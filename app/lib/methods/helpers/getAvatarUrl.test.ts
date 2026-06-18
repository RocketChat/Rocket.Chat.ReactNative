import { formatUrl, getAvatarURL } from './getAvatarUrl';
import { SubscriptionType } from '../../../definitions';

jest.mock('react-native', () => ({ PixelRatio: { get: () => 1 } }));

describe('formatUrl function', () => {
	test('formats the default URL to get the user avatar', () => {
		const url = 'https://mobile.qa.rocket.chat/avatar/reinaldoneto';
		const size = 30;
		const query = '&extraparam=true';
		const expected = 'https://mobile.qa.rocket.chat/avatar/reinaldoneto?format=png&size=30&extraparam=true';
		const result = formatUrl(url, size, query);
		expect(result).toEqual(expected);
	});

	test('formats an external provider URI to get the user avatar', () => {
		const url = 'https://open.rocket.chat/avatar/reinaldoneto';
		const size = 30;
		const query = undefined;
		const expected = 'https://open.rocket.chat/avatar/reinaldoneto?format=png&size=30';
		const result = formatUrl(url, size, query);
		expect(result).toEqual(expected);
	});

	test('formats an external provider URI that already includes a query to get the user avatar', () => {
		const url = 'https://open.rocket.chat/avatar?rcusername=reinaldoneto';
		const size = 30;
		const query = undefined;
		const expected = 'https://open.rocket.chat/avatar?rcusername=reinaldoneto&format=png&size=30';
		const result = formatUrl(url, size, query);
		expect(result).toEqual(expected);
	});
});

describe('getAvatarURL function', () => {
	test('returns the avatar unchanged when it is a base64 data URI', () => {
		const avatar = 'data:image/png;base64,ABC123';

		const expected = avatar;
		const result = getAvatarURL({ avatar });
		expect(result).toEqual(expected);
	});

	test('returns the avatar unchanged when it starts with http', () => {
		const avatar = 'https://example.com/avatar.png';
		const server = 'https://mobile.qa.rocket.chat';

		const expected = avatar;
		const result = getAvatarURL({ avatar, server });
		expect(result).toEqual(expected);
	});

	test('formats avatar URL with server when avatar does not start with http', () => {
		const avatar = '/avatar/user123';
		const server = 'https://mobile.qa.rocket.chat';
		const size = 30;

		const expected = 'https://mobile.qa.rocket.chat/avatar/user123?format=png&size=30';
		const result = getAvatarURL({ avatar, server, size });
		expect(result).toEqual(expected);
	});

	test('uses the external provider URL for direct messages when the server is older than 6.12.0', () => {
		const type = SubscriptionType.DIRECT;
		const text = 'username123';
		const avatarExternalProviderUrl = 'https://external.provider.com/avatar/{username}';
		const serverVersion = '6.11.0';
		const size = 30;

		const expected = 'https://external.provider.com/avatar/username123?format=png&size=30';
		const result = getAvatarURL({ type, text, avatarExternalProviderUrl, serverVersion, size });
		expect(result).toEqual(expected);
	});

	test('routes direct messages through the server when it is 6.12.0 or newer, ignoring the external provider URL', () => {
		const type = SubscriptionType.DIRECT;
		const text = 'username123';
		const avatarExternalProviderUrl = 'https://external.provider.com/avatar/{username}';
		const server = 'https://mobile.qa.rocket.chat';
		const serverVersion = '6.12.0';
		const size = 30;

		const expected = 'https://mobile.qa.rocket.chat/avatar/username123?format=png&size=30';
		const result = getAvatarURL({ type, text, avatarExternalProviderUrl, server, serverVersion, size });
		expect(result).toEqual(expected);
	});

	test('routes direct messages through the server when the server version is unknown', () => {
		const type = SubscriptionType.DIRECT;
		const text = 'username123';
		const avatarExternalProviderUrl = 'https://external.provider.com/avatar/{username}';
		const server = 'https://mobile.qa.rocket.chat';
		const size = 30;

		const expected = 'https://mobile.qa.rocket.chat/avatar/username123?format=png&size=30';
		const result = getAvatarURL({ type, text, avatarExternalProviderUrl, server, size });
		expect(result).toEqual(expected);
	});

	test('uses the room avatar external provider URL when the server is between 3.8.0 and 6.12.0', () => {
		const rid = 'room123';
		const roomAvatarExternalProviderUrl = 'https://external.provider.com/room/{roomId}';
		const serverVersion = '5.0.0';
		const size = 30;

		const expected = 'https://external.provider.com/room/room123?format=png&size=30';
		const result = getAvatarURL({ rid, roomAvatarExternalProviderUrl, serverVersion, size });
		expect(result).toEqual(expected);
	});

	test('routes room avatars through the server when it is 6.12.0 or newer, ignoring the external provider URL', () => {
		const rid = 'room123';
		const roomAvatarExternalProviderUrl = 'https://external.provider.com/room/{roomId}';
		const server = 'https://mobile.qa.rocket.chat';
		const serverVersion = '6.12.0';
		const size = 30;

		const expected = 'https://mobile.qa.rocket.chat/avatar/room/room123?format=png&size=30';
		const result = getAvatarURL({ rid, roomAvatarExternalProviderUrl, server, serverVersion, size });
		expect(result).toEqual(expected);
	});

	test('uses room/{rid} format when serverVersion >= 3.6.0', () => {
		const rid = 'room123';
		const serverVersion = '3.6.0';
		const server = 'https://mobile.qa.rocket.chat';
		const size = 30;
		const text = 'roomname';

		const expected = 'https://mobile.qa.rocket.chat/avatar/room/room123?format=png&size=30';
		const result = getAvatarURL({ rid, serverVersion, server, size, text });
		expect(result).toEqual(expected);
	});

	test('uses @{text} format when serverVersion < 3.6.0 or no rid', () => {
		const text = 'username123';
		const serverVersion = '3.5.0';
		const server = 'https://mobile.qa.rocket.chat';
		const size = 30;

		const expected = 'https://mobile.qa.rocket.chat/avatar/@username123?format=png&size=30';
		const result = getAvatarURL({ text, serverVersion, server, size });
		expect(result).toEqual(expected);
	});

	test('adds authentication query parameters when userId, token, and blockUnauthenticatedAccess are provided', () => {
		const avatar = '/avatar/user123';
		const server = 'https://mobile.qa.rocket.chat';
		const userId = 'user123';
		const token = 'token123';
		const blockUnauthenticatedAccess = true;
		const size = 30;

		const expected = 'https://mobile.qa.rocket.chat/avatar/user123?format=png&size=30&rc_token=token123&rc_uid=user123';
		const result = getAvatarURL({ avatar, server, userId, token, blockUnauthenticatedAccess, size });
		expect(result).toEqual(expected);
	});

	test('adds avatarETag query parameter when provided', () => {
		const avatar = '/avatar/user123';
		const server = 'https://mobile.qa.rocket.chat';
		const avatarETag = 'etag123';
		const size = 30;

		const expected = 'https://mobile.qa.rocket.chat/avatar/user123?format=png&size=30&etag=etag123';
		const result = getAvatarURL({ avatar, server, avatarETag, size });
		expect(result).toEqual(expected);
	});

	test('adds both authentication and etag query parameters when all are provided', () => {
		const avatar = '/avatar/user123';
		const server = 'https://mobile.qa.rocket.chat';
		const userId = 'user123';
		const token = 'token123';
		const blockUnauthenticatedAccess = true;
		const avatarETag = 'etag123';
		const size = 30;

		const expected =
			'https://mobile.qa.rocket.chat/avatar/user123?format=png&size=30&rc_token=token123&rc_uid=user123&etag=etag123';
		const result = getAvatarURL({ avatar, server, userId, token, blockUnauthenticatedAccess, avatarETag, size });
		expect(result).toEqual(expected);
	});

	test('uses cdnPrefix when provided and starts with http', () => {
		const avatar = '/avatar/user123';
		const server = 'https://mobile.qa.rocket.chat';
		const cdnPrefix = 'https://cdn.example.com';
		const size = 30;

		const expected = 'https://cdn.example.com/avatar/user123?format=png&size=30';
		const result = getAvatarURL({ avatar, server, cdnPrefix, size });
		expect(result).toEqual(expected);
	});

	test('returns default avatar URL when no avatar is provided', () => {
		const text = 'username123';
		const server = 'https://mobile.qa.rocket.chat';
		const size = 30;

		const expected = 'https://mobile.qa.rocket.chat/avatar/@username123?format=png&size=30';
		const result = getAvatarURL({ text, server, size });
		expect(result).toEqual(expected);
	});

	test('trims trailing slashes from external provider URLs on servers older than 6.12.0', () => {
		const type = SubscriptionType.DIRECT;
		const text = 'username123';
		const avatarExternalProviderUrl = 'https://external.provider.com/avatar/{username}//';
		const serverVersion = '6.11.0';
		const size = 30;

		const expected = 'https://external.provider.com/avatar/username123?format=png&size=30';
		const result = getAvatarURL({ type, text, avatarExternalProviderUrl, serverVersion, size });
		expect(result).toEqual(expected);
	});

	test('trims trailing slashes from cdnPrefix', () => {
		const avatar = '/avatar/user123';
		const server = 'https://mobile.qa.rocket.chat';
		const cdnPrefix = 'https://cdn.example.com///';
		const size = 30;

		const expected = 'https://cdn.example.com/avatar/user123?format=png&size=30';
		const result = getAvatarURL({ avatar, server, cdnPrefix, size });
		expect(result).toEqual(expected);
	});
});
