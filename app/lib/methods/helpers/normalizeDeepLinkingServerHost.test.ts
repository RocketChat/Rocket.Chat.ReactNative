import { normalizeDeepLinkingServerHost } from './normalizeDeepLinkingServerHost';

describe('normalizeDeepLinkingServerHost', () => {
	it('returns empty string for empty input', () => {
		expect(normalizeDeepLinkingServerHost('')).toBe('');
	});

	it('adds https for host without scheme', () => {
		expect(normalizeDeepLinkingServerHost('open.rocket.chat')).toBe('https://open.rocket.chat');
	});

	it('uses http for localhost', () => {
		expect(normalizeDeepLinkingServerHost('localhost')).toBe('http://localhost');
		expect(normalizeDeepLinkingServerHost('localhost:3000')).toBe('http://localhost:3000');
	});

	it('upgrades http to https for non-localhost', () => {
		expect(normalizeDeepLinkingServerHost('http://example.com')).toBe('https://example.com');
	});

	it('strips trailing slash', () => {
		expect(normalizeDeepLinkingServerHost('https://example.com/')).toBe('https://example.com');
	});
});
