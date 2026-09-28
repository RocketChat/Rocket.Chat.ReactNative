import { decodeFilename } from '../decodeFilename';

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
