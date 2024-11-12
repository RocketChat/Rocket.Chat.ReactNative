import { insertEmojiAtCursor } from './insertEmojiAtCursor';

describe('insertEmojiAtCursor', () => {
	it('should insert emoji at the beginning of the text', () => {
		const result = insertEmojiAtCursor('Hello world', ':test2:', 0);
		expect(result).toEqual({
			updatedText: ':test2: Hello world',
			updatedCursor: 8
		});
	});

	it('should insert emoji at the end of the text', () => {
		const result = insertEmojiAtCursor('Hello world', ':test2:', 11);
		expect(result).toEqual({
			updatedText: 'Hello world :test2:',
			updatedCursor: 19
		});
	});

	it('should insert emoji in the middle of the text with spaces', () => {
		const result = insertEmojiAtCursor('Hello world', ':test2:', 5);
		expect(result).toEqual({
			updatedText: 'Hello :test2: world',
			updatedCursor: 13
		});
	});

	it('should add a space before the emoji if missing', () => {
		const result = insertEmojiAtCursor('Hello', ':test2:', 5);
		expect(result).toEqual({
			updatedText: 'Hello :test2:',
			updatedCursor: 13
		});
	});

	it('should add a space after the emoji if missing', () => {
		const result = insertEmojiAtCursor('Hello', ':test2:', 0);
		expect(result).toEqual({
			updatedText: ':test2: Hello',
			updatedCursor: 8
		});
	});

	it('should not add extra spaces if they are already present', () => {
		const result = insertEmojiAtCursor('Hello ', ':test2:', 6);
		expect(result).toEqual({
			updatedText: 'Hello :test2:',
			updatedCursor: 13
		});
	});
});
