import { formatUrl, getAvatarURL } from './getAvatarUrl';
import { SubscriptionType } from '../../../definitions';
import { compareServerVersion } from './compareServerVersion';

jest.mock('react-native', () => ({ PixelRatio: { get: () => 1 } }));
jest.mock('./compareServerVersion', () => ({
	compareServerVersion: jest.fn()
}));

const mockCompareServerVersion = compareServerVersion as jest.MockedFunction<typeof compareServerVersion>;

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
	beforeEach(() => {
		jest.clearAllMocks();
	});

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

	test('uses external provider URL for direct messages', () => {
		const type = SubscriptionType.DIRECT;
		const text = 'username123';
		const avatarExternalProviderUrl = 'https://external.provider.com/avatar/{username}';
		const size = 30;

		const expected = 'https://external.provider.com/avatar/username123?format=png&size=30';
		const result = getAvatarURL({ type, text, avatarExternalProviderUrl, size });
		expect(result).toEqual(expected);
	});

	test('uses room avatar external provider URL when serverVersion >= 3.8.0', () => {
		const rid = 'room123';
		const serverVersion = '3.8.0';
		const roomAvatarExternalProviderUrl = 'https://external.provider.com/room/{roomId}';
		const size = 30;

		mockCompareServerVersion.mockReturnValue(true);

		const expected = 'https://external.provider.com/room/room123?format=png&size=30';
		const result = getAvatarURL({ rid, serverVersion, roomAvatarExternalProviderUrl, size });
		expect(result).toEqual(expected);
		expect(mockCompareServerVersion).toHaveBeenCalledWith('3.8.0', 'greaterThanOrEqualTo', '3.8.0');
	});

	test('uses room/{rid} format when serverVersion >= 3.6.0', () => {
		const rid = 'room123';
		const serverVersion = '3.6.0';
		const server = 'https://mobile.qa.rocket.chat';
		const size = 30;
		const text = 'roomname';

		// compareServerVersion returns false for 'lowerThan' when version >= 3.6.0
		// The condition is !compareServerVersion(..., 'lowerThan', '3.6.0')
		// So we need to return false to make !false = true
		mockCompareServerVersion.mockReturnValue(false);

		const expected = 'https://mobile.qa.rocket.chat/avatar/room/room123?format=png&size=30';
		const result = getAvatarURL({ rid, serverVersion, server, size, text });
		expect(result).toEqual(expected);
		expect(mockCompareServerVersion).toHaveBeenCalledWith('3.6.0', 'lowerThan', '3.6.0');
	});

	test('uses @{text} format when serverVersion < 3.6.0 or no rid', () => {
		const text = 'username123';
		const serverVersion = '3.5.0';
		const server = 'https://mobile.qa.rocket.chat';
		const size = 30;

		mockCompareServerVersion.mockReturnValue(false);

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

		const expected = 'https://mobile.qa.rocket.chat/avatar/user123?format=png&size=30&rc_token=token123&rc_uid=user123&etag=etag123';
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

		mockCompareServerVersion.mockReturnValue(false);

		const expected = 'https://mobile.qa.rocket.chat/avatar/@username123?format=png&size=30';
		const result = getAvatarURL({ text, server, size });
		expect(result).toEqual(expected);
	});

	test('trims trailing slashes from external provider URLs', () => {
		const type = SubscriptionType.DIRECT;
		const text = 'username123';
		const avatarExternalProviderUrl = 'https://external.provider.com/avatar/{username}//';
		const size = 30;

		const expected = 'https://external.provider.com/avatar/username123?format=png&size=30';
		const result = getAvatarURL({ type, text, avatarExternalProviderUrl, size });
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
