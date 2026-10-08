import { getOrigin, isSameOrigin } from '../getOrigin';

describe('getOrigin', () => {
	it('returns the lowercased origin of an http(s) url', () => {
		expect(getOrigin('HTTPS://Open.Rocket.CHAT/path?q=1')).toBe('https://open.rocket.chat');
		expect(getOrigin('http://localhost:8000/api')).toBe('http://localhost:8000');
	});

	it('drops the default port', () => {
		expect(getOrigin('https://open.rocket.chat:443/')).toBe('https://open.rocket.chat');
	});

	it('returns null for a non-http(s) url', () => {
		expect(getOrigin('ftp://open.rocket.chat')).toBeNull();
		expect(getOrigin('javascript:alert(1)')).toBeNull();
	});

	it('returns null for an empty, relative or schemeless url', () => {
		expect(getOrigin('')).toBeNull();
		expect(getOrigin('/sso/api')).toBeNull();
		expect(getOrigin('open.rocket.chat')).toBeNull();
	});
});

describe('isSameOrigin', () => {
	it('is true for urls on the same origin regardless of case, path or default port', () => {
		expect(isSameOrigin('https://open.rocket.chat/sso/api?token=1', 'https://open.rocket.chat')).toBe(true);
		expect(isSameOrigin('HTTPS://Open.Rocket.CHAT:443/api', 'https://open.rocket.chat')).toBe(true);
	});

	it('is false for another host, scheme or port', () => {
		expect(isSameOrigin('https://sso.example.com/api', 'https://open.rocket.chat')).toBe(false);
		expect(isSameOrigin('https://open.rocket.chat.evil.example/api', 'https://open.rocket.chat')).toBe(false);
		expect(isSameOrigin('http://open.rocket.chat/api', 'https://open.rocket.chat')).toBe(false);
		expect(isSameOrigin('https://open.rocket.chat:8443/api', 'https://open.rocket.chat')).toBe(false);
	});

	it('is false when the url has no valid origin, even if the other one has none either', () => {
		expect(isSameOrigin('/sso/api', 'https://open.rocket.chat')).toBe(false);
		expect(isSameOrigin('/sso/api', 'open.rocket.chat')).toBe(false);
		expect(isSameOrigin('', null)).toBe(false);
	});

	it('is false when there is nothing to compare against', () => {
		expect(isSameOrigin('https://open.rocket.chat/api', null)).toBe(false);
		expect(isSameOrigin('https://open.rocket.chat/api', '')).toBe(false);
	});
});
