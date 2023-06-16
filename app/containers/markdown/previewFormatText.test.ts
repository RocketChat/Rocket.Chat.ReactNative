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
	test('Format "[ ](https://open.rocket.chat/) Test" to be Test', () => {
		expect(previewFormatText('[ ](https://open.rocket.chat/) Test')).toEqual('Test');
	});
	test('Format "[Open](https://open.rocket.chat/) Test" to be Test', () => {
		expect(previewFormatText('[Open](https://open.rocket.chat/) Test')).toBe('Open Test');
	});
	test('render test (arabic)', () => {
		expect(previewFormatText('[ ](https://open.rocket.chat/) اختبا')).toBe('اختبا');
	});
	test('render test (russian)', () => {
		expect(previewFormatText('[ ](https://open.rocket.chat/) тест123')).toBe('тест123');
	});
	test('Format a quote message as last message "You: [ ](https://open.rocket.chat/group/channel?msg=nrTDSw96IhtF3iN4K) \nTest"', () => {
		expect(previewFormatText('You: [ ](https://open.rocket.chat/group/channel?msg=nrTDSw96IhtF3iN4K) \nTest')).toBe('You: Test');
	});
});
