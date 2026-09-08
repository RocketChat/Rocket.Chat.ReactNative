import { isConferenceUrl } from './isConferenceUrl';

describe('isConferenceUrl', () => {
	const server = 'https://open.rocket.chat';

	test('accepts the join url', () => {
		expect(isConferenceUrl('https://open.rocket.chat/conference/abc123', server)).toBe(true);
	});

	test('accepts the start url with its query string', () => {
		expect(isConferenceUrl('https://open.rocket.chat/conference/new?rid=GENERAL', server)).toBe(true);
	});

	test('rejects another page on the same server', () => {
		expect(isConferenceUrl('https://open.rocket.chat/channel/general', server)).toBe(false);
	});

	test('rejects the conference path on a different origin', () => {
		expect(isConferenceUrl('https://evil.example.com/conference/abc123', server)).toBe(false);
	});

	test('rejects a path that merely starts with the word conference', () => {
		expect(isConferenceUrl('https://open.rocket.chat/conferences/abc123', server)).toBe(false);
	});

	test('rejects a non-http scheme', () => {
		expect(isConferenceUrl('javascript:alert(1)//open.rocket.chat/conference/x', server)).toBe(false);
	});

	test('rejects a malformed url', () => {
		expect(isConferenceUrl('not a url', server)).toBe(false);
	});

	test('honours a server hosted on a subpath', () => {
		expect(isConferenceUrl('https://example.com/chat/conference/abc123', 'https://example.com/chat')).toBe(true);
		expect(isConferenceUrl('https://example.com/conference/abc123', 'https://example.com/chat')).toBe(false);
	});

	test('rejects everything when the server is unknown', () => {
		expect(isConferenceUrl('https://open.rocket.chat/conference/abc123', '')).toBe(false);
	});
});
