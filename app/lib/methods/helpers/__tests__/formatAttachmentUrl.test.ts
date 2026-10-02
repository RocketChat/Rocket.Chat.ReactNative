import { encodeAttachmentUrl, formatAttachmentUrl } from '../formatAttachmentUrl';
import { store } from '~/lib/store/auxStore';

jest.mock('~/lib/store/auxStore', () => ({
	store: { getState: jest.fn() }
}));

const SERVER = 'https://mobile.qa.rocket.chat';
const mockSettings = (settings: Record<string, unknown>) =>
	(store.getState as jest.Mock).mockReturnValue({ settings: { FileUpload_ProtectFiles: true, ...settings } });

describe('formatAttachmentUrl', () => {
	beforeEach(() => mockSettings({}));

	it('appends credentials to a relative path on the server', () => {
		expect(formatAttachmentUrl('/file-upload/1/a.png', 'uid', 'tok', SERVER)).toBe(
			`${SERVER}/file-upload/1/a.png?rc_token=tok&rc_uid=uid`
		);
	});

	it('appends credentials to an absolute url on the server origin', () => {
		expect(formatAttachmentUrl(`${SERVER}/file-upload/1/a.png`, 'uid', 'tok', SERVER)).toBe(
			`${SERVER}/file-upload/1/a.png?rc_token=tok&rc_uid=uid`
		);
	});

	it('appends credentials to the CDN_PREFIX origin', () => {
		mockSettings({ CDN_PREFIX: 'https://cdn.qa.rocket.chat/' });
		expect(formatAttachmentUrl('https://cdn.qa.rocket.chat/file-upload/1/a.png', 'uid', 'tok', SERVER)).toBe(
			'https://cdn.qa.rocket.chat/file-upload/1/a.png?rc_token=tok&rc_uid=uid'
		);
	});

	it.each([
		['third-party host', 'https://evil.example/pixel.jpg'],
		['look-alike suffix host', 'https://mobile.qa.rocket.chat.evil.com/pixel.jpg'],
		['userinfo host', 'https://mobile.qa.rocket.chat@evil.com/pixel.jpg'],
		['different port', 'https://mobile.qa.rocket.chat:8443/pixel.jpg'],
		['different scheme', 'http://mobile.qa.rocket.chat/pixel.jpg']
	])('does not leak credentials to %s', (_name, url) => {
		const result = formatAttachmentUrl(url, 'uid', 'tok', SERVER);
		expect(result).not.toContain('rc_token');
		expect(result).not.toContain('rc_uid');
	});

	it('does not leak when title_link is attacker-controlled but image_url looks trusted', () => {
		const result = formatAttachmentUrl('https://evil.example/x', 'uid', 'tok', SERVER, `${SERVER}/file-upload/1/a.png`);
		expect(result).toBe('https://evil.example/x');
	});

	it('returns the original url when it is on another origin', () => {
		expect(formatAttachmentUrl(`${SERVER}/a.png`, 'uid', 'tok', SERVER, 'https://mobile.qa.rocket.chat.evil.com/a.png')).toBe(
			'https://mobile.qa.rocket.chat.evil.com/a.png'
		);
	});

	it('does not add credentials to a relative path that escapes the server origin', () => {
		const result = formatAttachmentUrl('@evil.com/x', 'uid', 'tok', SERVER);
		expect(result).not.toContain('rc_token');
	});

	it.each(['.evil.com/x', '\t.evil.com/x', ':8443@evil.com/x'])(
		'does not add credentials to host-like relative path %j',
		path => {
			const result = formatAttachmentUrl(path, 'uid', 'tok', SERVER);
			expect(result).not.toContain('rc_token');
			expect(result).not.toContain('rc_uid');
		}
	);

	it('keeps a backslash-prefixed relative path on the server origin', () => {
		// WHATWG parsing turns `\\` into `/`, so this is a path on the server, not a host.
		const url = new URL(formatAttachmentUrl('\\\\evil.com/x', 'uid', 'tok', SERVER));
		expect(url.origin).toBe(SERVER);
	});

	it('does not add credentials (and does not throw) when the server is empty', () => {
		expect(formatAttachmentUrl('/file-upload/1/a.png', 'uid', 'tok', '')).toBe('/file-upload/1/a.png');
	});

	it('trusts the CDN_PREFIX origin for an original url', () => {
		mockSettings({ CDN_PREFIX: 'https://cdn.qa.rocket.chat' });
		const cdn = 'https://cdn.qa.rocket.chat/file-upload/1/a.png';
		expect(formatAttachmentUrl(cdn, 'uid', 'tok', SERVER, cdn)).toBe(`${cdn}?rc_token=tok&rc_uid=uid`);
	});

	it('does not trust the CDN_PREFIX when it is not an http url', () => {
		mockSettings({ CDN_PREFIX: 'cdn.qa.rocket.chat' });
		expect(formatAttachmentUrl('https://cdn.qa.rocket.chat/a.png', 'uid', 'tok', SERVER)).not.toContain('rc_token');
	});

	it('does not add credentials when files are not protected', () => {
		mockSettings({ FileUpload_ProtectFiles: false });
		expect(formatAttachmentUrl(`${SERVER}/a.png`, 'uid', 'tok', SERVER)).toBe(`${SERVER}/a.png`);
	});
});

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
