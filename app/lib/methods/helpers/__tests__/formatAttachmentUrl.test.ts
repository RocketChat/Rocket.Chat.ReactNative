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

	it('leaves an already-escaped reserved character in the path', () => {
		expect(encodeAttachmentUrl('https://open.rocket.chat/file-upload/1/a%20video%20%232.mov')).toBe(
			'https://open.rocket.chat/file-upload/1/a%20video%20%232.mov'
		);
	});

	// Known limitation, not a regression: `#` is the fragment delimiter per the URL spec, so a raw one ends the
	// path and the rest becomes the fragment — which HTTP drops, so the server sees a truncated path. The previous
	// encodeURI behaved identically (it leaves `#` unescaped too). Only reachable if the server sends a raw `#`.
	it('treats a raw reserved `#` in the path as a fragment', () => {
		expect(encodeAttachmentUrl('https://open.rocket.chat/file-upload/1/a video #2.mov')).toBe(
			'https://open.rocket.chat/file-upload/1/a%20video%20#2.mov'
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

	// Cache filenames keep unicode letters, so local uris need encoding before they reach the native players.
	it('encodes unicode letters in a local file uri', () => {
		expect(encodeAttachmentUrl('file:///var/app/Documents/server/msg1/vídeo.mov')).toBe(
			'file:///var/app/Documents/server/msg1/v%C3%ADdeo.mov'
		);
	});

	it('leaves an already-encoded local file uri untouched', () => {
		expect(encodeAttachmentUrl('file:///var/app/Documents/server/msg1/v%C3%ADdeo.mov')).toBe(
			'file:///var/app/Documents/server/msg1/v%C3%ADdeo.mov'
		);
	});
});
