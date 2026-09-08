import { buildConferenceUrl } from './buildConferenceUrl';

describe('buildConferenceUrl', () => {
	const server = 'https://open.rocket.chat';

	test('builds the join url for an existing call', () => {
		expect(buildConferenceUrl(server, { callId: 'abc123' })).toEqual('https://open.rocket.chat/conference/abc123');
	});

	test('builds the start url from a room id', () => {
		expect(buildConferenceUrl(server, { rid: 'GENERAL' })).toEqual('https://open.rocket.chat/conference/new?rid=GENERAL');
	});

	test('does not double the slash when the server has a trailing one', () => {
		expect(buildConferenceUrl('https://open.rocket.chat/', { callId: 'abc123' })).toEqual(
			'https://open.rocket.chat/conference/abc123'
		);
	});

	test('keeps a subpath server prefix', () => {
		expect(buildConferenceUrl('https://example.com/chat', { callId: 'abc123' })).toEqual(
			'https://example.com/chat/conference/abc123'
		);
	});

	test('escapes a room id containing url-significant characters', () => {
		expect(buildConferenceUrl(server, { rid: 'a b&c=d' })).toEqual('https://open.rocket.chat/conference/new?rid=a+b%26c%3Dd');
	});

	test('escapes a call id containing url-significant characters', () => {
		expect(buildConferenceUrl(server, { callId: 'a/b?c' })).toEqual('https://open.rocket.chat/conference/a%2Fb%3Fc');
	});

	test('returns an empty string when the server is not a url', () => {
		expect(buildConferenceUrl('not a url', { callId: 'abc123' })).toEqual('');
	});
});
