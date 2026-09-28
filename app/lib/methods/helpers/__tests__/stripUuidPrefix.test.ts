import { stripUuidPrefix } from '../stripUuidPrefix';

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
