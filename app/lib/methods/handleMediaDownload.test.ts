import { getFilename } from './handleMediaDownload';

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
