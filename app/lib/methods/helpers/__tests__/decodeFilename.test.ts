import { decodeFilename, getFilenameFromUri, stripUuidPrefix } from '../decodeFilename';

describe('decodeFilename', () => {
	it('decodes percent-encoded Cyrillic', () => {
		expect(decodeFilename('%D0%9F%D1%80%D0%B8%D0%BC%D0%B5%D1%80.pdf')).toBe('Пример.pdf');
	});

	it('decodes spaces and leaves plus signs alone', () => {
		expect(decodeFilename('my%20file.pdf')).toBe('my file.pdf');
		expect(decodeFilename('a+b.pdf')).toBe('a+b.pdf');
	});

	it('returns undefined and empty string as-is', () => {
		expect(decodeFilename(undefined)).toBeUndefined();
		expect(decodeFilename('')).toBe('');
	});

	it('leaves decoded Cyrillic untouched', () => {
		expect(decodeFilename('Пример.pdf')).toBe('Пример.pdf');
	});

	it('leaves ASCII untouched', () => {
		expect(decodeFilename('test.pdf')).toBe('test.pdf');
	});

	it('leaves malformed escapes untouched', () => {
		expect(decodeFilename('100% sure.pdf')).toBe('100% sure.pdf');
		expect(decodeFilename('100%.pdf')).toBe('100%.pdf');
	});

	it('fully decodes double-encoded input', () => {
		expect(decodeFilename('%25D0%259F.pdf')).toBe('П.pdf');
	});
});

describe('stripUuidPrefix', () => {
	it('strips iOS/Android share-collision UUID prefix', () => {
		expect(stripUuidPrefix('550e8400-e29b-41d4-a716-446655440000-Пример.pdf')).toBe('Пример.pdf');
	});

	it('strips uppercase UUID prefix', () => {
		expect(stripUuidPrefix('550E8400-E29B-41D4-A716-446655440000-file.pdf')).toBe('file.pdf');
	});

	it('leaves regular filenames untouched', () => {
		expect(stripUuidPrefix('Пример.pdf')).toBe('Пример.pdf');
	});

	it('leaves non-UUID dashed names untouched', () => {
		expect(stripUuidPrefix('1234-report.pdf')).toBe('1234-report.pdf');
	});
});

describe('getFilenameFromUri', () => {
	it('extracts and decodes basename and strips UUID', () => {
		expect(
			getFilenameFromUri('file:///group/550e8400-e29b-41d4-a716-446655440000-%D0%9F%D1%80%D0%B8%D0%BC%D0%B5%D1%80.pdf')
		).toBe('Пример.pdf');
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
