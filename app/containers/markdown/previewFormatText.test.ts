import { previewFormatText } from './previewFormatText';

describe('Format preview message', () => {
	test('empty to be empty', () => {
		expect(previewFormatText('')).toBe('');
	});
	test('A123 to be A123', () => {
		expect(previewFormatText('A123')).toBe('A123');
	});
	test('Format <http://link|Text> to be Text', () => {
		expect(previewFormatText('<http://link|Text>')).toBe('Text');
	});
	test('Format "[ ](https://chat.cortexflex.org/) Test" to be Test', () => {
		expect(previewFormatText('[ ](https://chat.cortexflex.org/) Test')).toEqual('Test');
	});
	test('Format "[Open](https://chat.cortexflex.org/) Test" to be Test', () => {
		expect(previewFormatText('[Open](https://chat.cortexflex.org/) Test')).toBe('Open Test');
	});
	test('render test (arabic)', () => {
		expect(previewFormatText('[ ](https://chat.cortexflex.org/) اختبا')).toBe('اختبا');
	});
	test('render test (russian)', () => {
		expect(previewFormatText('[ ](https://chat.cortexflex.org/) тест123')).toBe('тест123');
	});
	test('Format a quote message as last message "You: [ ](https://chat.cortexflex.org/group/channel?msg=nrTDSw96IhtF3iN4K) \nTest"', () => {
		expect(previewFormatText('You: [ ](https://chat.cortexflex.org/group/channel?msg=nrTDSw96IhtF3iN4K) \nTest')).toBe('You: Test');
	});
});
