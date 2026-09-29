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

	it('returns undefined for empty input', () => {
		expect(getFilenameFromUri(undefined)).toBeUndefined();
		expect(getFilenameFromUri('')).toBeUndefined();
	});
});
