import { Image } from 'react-native-image-crop-picker';

import { forceJpgExtension } from './forceJpgExtension';

const attachment: Image = {
	exif: null,
	filename: 'IMG_0040.PNG',
	path: 'tmp/temp',
	height: 534,
	width: 223,
	data: null,
	modificationDate: '1643984790',
	localIdentifier: 'device/L0/001',
	size: 16623,
	sourceURL: '',
	mime: 'image/jpeg',
	cropRect: null,
	creationDate: '1641490665'
};

describe('forceJpgExtension for iOS', () => {
	jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
	describe('with mime as image/jpeg', () => {
		test('filename.jpg should be filename.jpg', () => {
			const newAttachment = attachment;
			newAttachment.filename = 'filename.jpg';
			const file = forceJpgExtension(newAttachment);

			expect(file.filename).toBe('filename.jpg');
		});
		test('filename.png should be filename.jpg', () => {
			const newAttachment = attachment;
			newAttachment.filename = 'filename.png';
			const file = forceJpgExtension(newAttachment);

			expect(file.filename).toBe('filename.jpg');
		});
		test('filename.jpeg should be filename.jpg', () => {
			const newAttachment = attachment;
			newAttachment.filename = 'filename.jpeg';
			const file = forceJpgExtension(newAttachment);

			expect(file.filename).toBe('filename.jpg');
		});
		test('filename.heic should be filename.jpg', () => {
			const newAttachment = attachment;
			newAttachment.filename = 'filename.heic';
			const file = forceJpgExtension(newAttachment);

			expect(file.filename).toBe('filename.jpg');
		});
	});
	describe('with mime different', () => {
		test('filename.jpg should be filename.jpg', () => {
			const newAttachment = attachment;
			newAttachment.filename = 'filename.png';
			newAttachment.mime = 'image/png';
			const file = forceJpgExtension(newAttachment);

			expect(file.filename).toBe('filename.png');
		});
	});
});

describe('forceJpgExtension for android', () => {
	jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));
	describe('with mime as image/jpeg', () => {
		test('filename.jpg should be filename.jpg', () => {
			const newAttachment = attachment;
			newAttachment.filename = 'filename.jpg';
			const file = forceJpgExtension(newAttachment);

			expect(file.filename).toBe('filename.jpg');
		});
		test('filename.png should be filename.png', () => {
			const newAttachment = attachment;
			newAttachment.filename = 'filename.png';
			const file = forceJpgExtension(newAttachment);

			expect(file.filename).toBe('filename.png');
		});
		test('filename.jpeg should be filename.jpeg', () => {
			const newAttachment = attachment;
			newAttachment.filename = 'filename.jpeg';
			const file = forceJpgExtension(newAttachment);

			expect(file.filename).toBe('filename.jpeg');
		});
		test('filename.heic should be filename.heic', () => {
			const newAttachment = attachment;
			newAttachment.filename = 'filename.heic';
			const file = forceJpgExtension(newAttachment);

			expect(file.filename).toBe('filename.heic');
		});
	});
	describe('with mime different', () => {
		test('filename.jpg should be filename.jpg', () => {
			const newAttachment = attachment;
			newAttachment.filename = 'filename.png';
			newAttachment.mime = 'image/png';
			const file = forceJpgExtension(newAttachment);

			expect(file.filename).toBe('filename.png');
		});
	});
});
