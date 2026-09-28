import { decodeFilename, getFilenameFromUri, stripUuidPrefix } from '../decodeFilename';

describe('decodeFilename', () => {
	it('decodes percent-encoded Cyrillic', () => {
		expect(decodeFilename('%D0%9F%D1%80%D0%B8%D0%BC%D0%B5%D1%80.pdf')).toBe('Пример.pdf');
	});

	it('leaves decoded Cyrillic untouched', () => {
		expect(decodeFilename('Пример.pdf')).toBe('Пример.pdf');
	});

	it('leaves ASCII untouched', () => {
		expect(decodeFilename('test.pdf')).toBe('test.pdf');
	});

	it('leaves malformed escapes untouched', () => {
		expect(decodeFilename('100% sure.pdf')).toBe('100% sure.pdf');
	});

	it('fully decodes double-encoded input', () => {
		expect(decodeFilename('%25D0%259F.pdf')).toBe('П.pdf');
	});
});

describe('stripUuidPrefix', () => {
	it('strips iOS/Android share-collision UUID prefix', () => {
		expect(stripUuidPrefix('550e8400-e29b-41d4-a716-446655440000-Пример.pdf')).toBe('Пример.pdf');
	});

	it('leaves regular filenames untouched', () => {
		expect(stripUuidPrefix('Пример.pdf')).toBe('Пример.pdf');
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
});
