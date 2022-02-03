import { replaceImageFilename } from './replaceImageFilename';

describe('replaceImageFilename', () => {
	test('filename.jpg should be filename.jpg', () => {
		expect(replaceImageFilename('filename.jpg')).toBe('filename.jpg');
	});
	test('filename.png should be filename.jpg', () => {
		expect(replaceImageFilename('filename.png')).toBe('filename.jpg');
	});
	test('filename.heic should be filename.jpg', () => {
		expect(replaceImageFilename('filename.heic')).toBe('filename.jpg');
	});
	test('filename.jpeg should be filename.jpg', () => {
		expect(replaceImageFilename('filename.jpeg')).toBe('filename.jpg');
	});
	test('filename.bmp should be filename.jpg', () => {
		expect(replaceImageFilename('filename.bmp')).toBe('filename.jpg');
	});
	test('rocket.chat-filename.bmp should be rocket.chat-filename.jpg', () => {
		expect(replaceImageFilename('rocket.chat-filename.bmp')).toBe('rocket.chat-filename.jpg');
	});
	test('app/rocket.chat-filename.jpeg should be app/rocket.chat-filename.jpg', () => {
		expect(replaceImageFilename('app/rocket.chat-filename.jpeg')).toBe('app/rocket.chat-filename.jpg');
	});
});
