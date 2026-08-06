import { encodeAttachmentUrl } from '../formatAttachmentUrl';

describe('encodeAttachmentUrl', () => {
	it('encodes an unencoded path', () => {
		expect(encodeAttachmentUrl('https://open.rocket.chat/file-upload/1/Screen Recording.mov')).toBe(
			'https://open.rocket.chat/file-upload/1/Screen%20Recording.mov'
		);
	});

	it('leaves an already-encoded path untouched', () => {
		expect(encodeAttachmentUrl('https://open.rocket.chat/file-upload/1/Screen%20Recording.mov')).toBe(
			'https://open.rocket.chat/file-upload/1/Screen%20Recording.mov'
		);
	});

	it('leaves an escaped reserved character untouched', () => {
		expect(encodeAttachmentUrl('https://open.rocket.chat/file-upload/1/a%20video%20%232.mov')).toBe(
			'https://open.rocket.chat/file-upload/1/a%20video%20%232.mov'
		);
	});

	it('preserves the query string', () => {
		expect(encodeAttachmentUrl('https://open.rocket.chat/file-upload/1/Screen Recording.mov?rc_token=abc&rc_uid=123')).toBe(
			'https://open.rocket.chat/file-upload/1/Screen%20Recording.mov?rc_token=abc&rc_uid=123'
		);
	});

	// WHATWG URL passes a malformed escape through rather than throwing, so this exercises the try branch.
	it('returns the raw url when it has a malformed escape', () => {
		expect(encodeAttachmentUrl('https://open.rocket.chat/file-upload/1/%ZZ.mov')).toBe(
			'https://open.rocket.chat/file-upload/1/%ZZ.mov'
		);
	});

	// A non-absolute url is what actually throws — reachable when the server/CDN prefix is empty.
	it('returns the raw url when it is not absolute', () => {
		expect(encodeAttachmentUrl('/file-upload/1/Screen Recording.mov')).toBe('/file-upload/1/Screen Recording.mov');
	});
});
