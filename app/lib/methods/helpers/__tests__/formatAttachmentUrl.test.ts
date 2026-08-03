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

	it('returns the raw url when it has a malformed escape', () => {
		expect(encodeAttachmentUrl('https://open.rocket.chat/file-upload/1/%ZZ.mov')).toBe(
			'https://open.rocket.chat/file-upload/1/%ZZ.mov'
		);
	});
});
