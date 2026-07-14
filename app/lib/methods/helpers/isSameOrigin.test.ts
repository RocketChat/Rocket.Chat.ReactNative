import { isSameOrigin } from './isSameOrigin';

describe('isSameOrigin', () => {
	test('returns true for same-origin absolute URLs', () => {
		expect(isSameOrigin('https://open.rocket.chat/api/v1/x', 'https://open.rocket.chat')).toBe(true);
	});

	test('returns false for cross-origin absolute URLs', () => {
		expect(isSameOrigin('https://releases.rocket.chat/v2/server/supportedVersions', 'https://open.rocket.chat')).toBe(false);
		expect(isSameOrigin('https://external.provider.com/avatar/user', 'https://open.rocket.chat')).toBe(false);
	});

	test('returns false when scheme differs', () => {
		expect(isSameOrigin('http://open.rocket.chat/avatar/x', 'https://open.rocket.chat')).toBe(false);
	});

	test('returns true for relative URLs', () => {
		expect(isSameOrigin('/api/v1/x', 'https://open.rocket.chat')).toBe(true);
	});

	test('returns true when origin is undefined', () => {
		expect(isSameOrigin('https://releases.rocket.chat/x')).toBe(true);
	});
});
