import { getFilename, matchDownloadUrl } from './handleMediaDownload';

describe('matchDownloadUrl', () => {
	it('matches when downloadUrl contains image_url', () => {
		expect(
			matchDownloadUrl({ image_url: '/file-upload/abc/photo.jpg' }, 'https://server.com/file-upload/abc/photo.jpg')
		).toBeTruthy();
	});

	it('matches when downloadUrl contains audio_url', () => {
		expect(
			matchDownloadUrl({ audio_url: '/file-upload/abc/audio.mp3' }, 'https://server.com/file-upload/abc/audio.mp3')
		).toBeTruthy();
	});

	it('matches when downloadUrl contains video_url', () => {
		expect(
			matchDownloadUrl({ video_url: '/file-upload/abc/video.mp4' }, 'https://server.com/file-upload/abc/video.mp4')
		).toBeTruthy();
	});

	it('returns falsy when none of the attachment URLs match', () => {
		expect(
			matchDownloadUrl({ audio_url: '/file-upload/abc/other.mp3' }, 'https://server.com/file-upload/xyz/audio.mp3')
		).toBeFalsy();
	});

	it('returns falsy when the attachment has no URL fields', () => {
		expect(matchDownloadUrl({}, 'https://server.com/file-upload/abc/audio.mp3')).toBeFalsy();
	});

	it('does not match image_url against an unrelated audio download', () => {
		expect(
			matchDownloadUrl({ image_url: '/file-upload/abc/photo.jpg' }, 'https://server.com/file-upload/abc/audio.mp3')
		).toBeFalsy();
	});
});

describe('Test the getFilename', () => {
	it('returns the title without changes', () => {
		const { image_type, image_url, title } = {
			title: 'help-image.png',
			image_url: '/file-upload/oTQmb2zRCsYF4pdHv/help-image-url.png',
			image_type: 'image/png'
		};

		const filename = getFilename({ type: 'image', mimeType: image_type, title, url: image_url });
		expect(filename).toBe(title);
	});

	it("returns the title with correct extension based on image_type when the title's extension is wrong", () => {
		const { image_type, image_url, title } = {
			title: 'help-image.MOV',
			image_url: '/file-upload/oTQmb2zRCsYF4pdHv/help-image-url.MOV',
			image_type: 'image/png'
		};

		const filename = getFilename({ type: 'image', mimeType: image_type, title, url: image_url });
		expect(filename).toBe('help-image.png');
	});

	it("returns the filename from image_url when there isn't extension at title", () => {
		const { image_type, image_url, title } = {
			title: 'help-image',
			image_url: '/file-upload/oTQmb2zRCsYF4pdHv/help-image-url.png',
			image_type: 'image/png'
		};

		const filename = getFilename({ type: 'image', mimeType: image_type, title, url: image_url });
		expect(filename).toBe('help-image-url.png');
	});

	it("returns the filename from image_url with correct extension based on image_type when there isn't extension at title and the image_url's extension is wrong", () => {
		const { image_type, image_url, title } = {
			title: 'help-image',
			image_url: '/file-upload/oTQmb2zRCsYF4pdHv/help-image-url.MOV',
			image_type: 'image/png'
		};

		const filename = getFilename({ type: 'image', mimeType: image_type, title, url: image_url });
		expect(filename).toBe('help-image-url.png');
	});

	it("returns the filename from image_url and based on the image_type when there isn't extension either at title and image_url", () => {
		const { image_type, image_url, title } = {
			title: 'help-image',
			image_url: '/file-upload/oTQmb2zRCsYF4pdHv/help-image-url.png',
			image_type: 'image/png'
		};

		const filename = getFilename({ type: 'image', mimeType: image_type, title, url: image_url });
		expect(filename).toBe('help-image-url.png');
	});

	it('returns the filename with the gif extension from a gif sent by tenor/giphy', () => {
		const { image_type, image_url, title } = {
			title: undefined,
			image_url: 'https://media4.giphy.com/media/bGtO3RlAPHkeQ/giphy.gif',
			image_type: undefined
		};

		const filename = getFilename({ type: 'image', mimeType: image_type, title, url: image_url });
		expect(filename).toBe('giphy.gif');
	});
});
