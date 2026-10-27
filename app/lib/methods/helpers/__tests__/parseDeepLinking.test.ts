import parseDeepLinking from '../parseDeepLinking';

describe('parseDeepLinking', () => {
	it('parses an OAuth redirect URL', () => {
		const result = parseDeepLinking(
			'rocketchat://auth?host=https://open.rocket.chat&type=oauth&credentialToken=abc&credentialSecret=def'
		);
		expect(result).toMatchObject({
			type: 'oauth',
			host: 'https://open.rocket.chat',
			credentialToken: 'abc',
			credentialSecret: 'def'
		});
	});

	it('parses a room URL', () => {
		const result = parseDeepLinking('rocketchat://room?host=open.rocket.chat&rid=GENERAL&path=channel/general');
		expect(result).toMatchObject({ host: 'open.rocket.chat', rid: 'GENERAL' });
	});

	it('parses an invite URL', () => {
		const result = parseDeepLinking('rocketchat://invite?host=open.rocket.chat&path=invite/token123');
		expect(result).toMatchObject({ host: 'open.rocket.chat', path: 'invite/token123' });
	});

	it('parses a shareextension URL and sets type to shareextension', () => {
		const result = parseDeepLinking('rocketchat://shareextension?text=hello');
		expect(result).toMatchObject({ type: 'shareextension' });
	});

	it('returns null for a non-matching URL', () => {
		expect(parseDeepLinking('https://example.com/some/path')).toBeNull();
	});

	it('returns null for an empty string', () => {
		expect(parseDeepLinking('')).toBeNull();
	});
});
