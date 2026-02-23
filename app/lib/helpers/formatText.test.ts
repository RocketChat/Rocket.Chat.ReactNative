import { formatText } from './formatText';

describe('FormatText', () => {
	test('empty to be empty', () => {
		expect(formatText('')).toBe('');
	});
	test('A123 to be A123', () => {
		expect(formatText('A123')).toBe('A123');
	});
	test('Format <http://link|Text> to be [Text](http://link)', () => {
		expect(formatText('<http://link|Text>')).toBe('[Text](http://link)');
	});
	test('render test (arabic)', () => {
		expect(formatText('اختبا <http://link|ر123>')).toBe('اختبا [ر123](http://link)');
	});

	test('render test (russian)', () => {
		expect(formatText('<http://link|тест123>')).toBe('[тест123](http://link)');
	});
});
