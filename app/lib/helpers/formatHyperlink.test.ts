import { formatHyperlink } from './formatHyperlink';

describe('FormatText', () => {
	test('empty to be empty', () => {
		expect(formatHyperlink('')).toBe('');
	});
	test('A123 to be A123', () => {
		expect(formatHyperlink('A123')).toBe('A123');
	});
	test('Format <http://link|Text> to be <http://link|Text>', () => {
		expect(formatHyperlink('<http://link|Text>')).toBe('<http://link|Text>');
	});
	test('Format "[ ](https://open.rocket.chat/) Test" to be Test', () => {
		expect(formatHyperlink('[ ](https://open.rocket.chat/) Test')).toBe('Test');
	});
	test('Format "[Open](https://open.rocket.chat/) Test" to be Test', () => {
		expect(formatHyperlink('[Open](https://open.rocket.chat/) Test')).toBe('[Open](https://open.rocket.chat/) Test');
	});
	test('render test (arabic)', () => {
		expect(formatHyperlink('[ ](https://open.rocket.chat/) اختبا')).toBe('اختبا');
	});

	test('render test (russian)', () => {
		expect(formatHyperlink('[ ](https://open.rocket.chat/) тест123')).toBe('тест123');
	});
});
