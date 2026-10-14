import { getFilenameFromUri } from '../getFilenameFromUri';

describe('getFilenameFromUri', () => {
	it('extracts and decodes basename keeping UUID prefix', () => {
		expect(
			getFilenameFromUri('file:///group/550e8400-e29b-41d4-a716-446655440000-%D0%9F%D1%80%D0%B8%D0%BC%D0%B5%D1%80.pdf')
		).toBe('550e8400-e29b-41d4-a716-446655440000-Пример.pdf');
	});

	it('extracts plain basename', () => {
		expect(getFilenameFromUri('file:///tmp/test.pdf')).toBe('test.pdf');
	});

	it('strips query strings', () => {
		expect(getFilenameFromUri('file:///tmp/%D0%9F%D1%80%D0%B8%D0%BC%D0%B5%D1%80.pdf?token=abc')).toBe('Пример.pdf');
	});

	it('decodes spaces and leaves plus signs alone', () => {
		expect(getFilenameFromUri('file:///tmp/my%20file.pdf')).toBe('my file.pdf');
		expect(getFilenameFromUri('file:///tmp/a+b.pdf')).toBe('a+b.pdf');
	});

	it('leaves malformed escapes untouched', () => {
		expect(getFilenameFromUri('file:///tmp/100%.pdf')).toBe('100%.pdf');
	});

	it('returns undefined for empty input', () => {
		expect(getFilenameFromUri(undefined)).toBeUndefined();
		expect(getFilenameFromUri('')).toBeUndefined();
	});

	it('leaves an already-decoded Cyrillic basename untouched', () => {
		expect(getFilenameFromUri('file:///tmp/Пример.pdf')).toBe('Пример.pdf');
	});

	it('decodes double-encoded input only once', () => {
		expect(getFilenameFromUri('file:///tmp/%25D0%259F.pdf')).toBe('%D0%9F.pdf');
	});

	it('decodes an encoded question mark in the basename', () => {
		expect(getFilenameFromUri('file:///tmp/what%3F.pdf')).toBe('what?.pdf');
	});

	it('returns the whole string when there is no slash', () => {
		expect(getFilenameFromUri('%D0%9F.pdf')).toBe('П.pdf');
	});

	it('returns an empty string for a uri ending in a slash', () => {
		expect(getFilenameFromUri('file:///tmp/')).toBe('');
	});

	it('decodes Chinese and emoji names', () => {
		expect(getFilenameFromUri('file:///tmp/%E6%96%87%E4%BB%B6.pdf')).toBe('文件.pdf');
		expect(getFilenameFromUri('file:///tmp/%F0%9F%98%80.png')).toBe('😀.png');
	});
});
