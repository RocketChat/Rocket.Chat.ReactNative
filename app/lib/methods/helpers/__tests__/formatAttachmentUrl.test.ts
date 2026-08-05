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

	it('returns the raw url when it has a malformed escape', () => {
		expect(encodeAttachmentUrl('https://open.rocket.chat/file-upload/1/%ZZ.mov')).toBe(
			'https://open.rocket.chat/file-upload/1/%ZZ.mov'
		);
	});
});
