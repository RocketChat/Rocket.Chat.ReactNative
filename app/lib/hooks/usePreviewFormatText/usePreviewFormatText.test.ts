import { renderHook } from '@testing-library/react-native';

import { mockedStore } from '../../../reducers/mockedStore';
import { setUser } from '../../../actions/login';
import usePreviewFormatText from './index';

jest.mock('../useAppSelector', () => ({
	useAppSelector: () => mockedStore.getState().login.user.settings?.preferences?.convertAsciiEmoji
}));

const initialMockedStoreState = () => {
	mockedStore.dispatch(
		setUser({
			settings: {
				preferences: {
					convertAsciiEmoji: true
				}
			}
		})
	);
};

initialMockedStoreState();

const renderPreviewFormatText = (msg: string) => {
	const { result } = renderHook(() => usePreviewFormatText(msg));
	return result.current;
};

describe('Format preview message', () => {
	test('empty to be empty', () => {
		const formattedText = renderPreviewFormatText('');
		expect(formattedText).toBe('');
	});
	test('A123 to be A123', () => {
		const formattedText = renderPreviewFormatText('A123');
		expect(formattedText).toBe('A123');
	});
	test('Format <http://link|Text> to be Text', () => {
		const formattedText = renderPreviewFormatText('<http://link|Text>');
		expect(formattedText).toBe('Text');
	});
	test('Format "[ ](https://open.rocket.chat/) Test" to be Test', () => {
		const formattedText = renderPreviewFormatText('[ ](https://open.rocket.chat/) Test');
		expect(formattedText).toEqual('Test');
	});
	test('Format "[Open](https://open.rocket.chat/) Test" to be Test', () => {
		const formattedText = renderPreviewFormatText('[Open](https://open.rocket.chat/) Test');
		expect(formattedText).toBe('Open Test');
	});
	test('render test (arabic)', () => {
		const formattedText = renderPreviewFormatText('[ ](https://open.rocket.chat/) اختبا');
		expect(formattedText).toBe('اختبا');
	});
	test('render test (russian)', () => {
		const formattedText = renderPreviewFormatText('[ ](https://open.rocket.chat/) тест123');
		expect(formattedText).toBe('тест123');
	});
	test('Format a quote message as last message "You: [ ](https://open.rocket.chat/group/channel?msg=nrTDSw96IhtF3iN4K) \nTest"', () => {
		const formattedText = renderPreviewFormatText(
			'You: [ ](https://open.rocket.chat/group/channel?msg=nrTDSw96IhtF3iN4K) \nTest'
		);
		expect(formattedText).toBe('You: Test');
	});
	test('Format a bold message as last message "You: **Test**" to be "You: Test"', () => {
		const formattedText = renderPreviewFormatText('You: **Test**');
		expect(formattedText).toBe('You: Test');
	});
	test('Format a italic message as last message "You: _Test_" to be "You: Test"', () => {
		const formattedText = renderPreviewFormatText('You: _Test_');
		expect(formattedText).toBe('You: Test');
	});
	test('Format a strike message as last message "You: ~Test~" to be "You: Test"', () => {
		const formattedText = renderPreviewFormatText('You: ~Test~');
		expect(formattedText).toBe('You: Test');
	});
	test('Format a quote message as last message "You: > Test" to be "You: Test"', () => {
		const formattedText = renderPreviewFormatText('You: > Test');
		expect(formattedText).toBe('You: Test');
	});
	test('Format a bold italic message as last message "You: *_Test_*" to be "You: Test"', () => {
		const formattedText = renderPreviewFormatText('You: *_Test_*');
		expect(formattedText).toBe('You: Test');
	});
	test('Format a bold strike message as last message "You: *~Test~*" to be "You: Test"', () => {
		const formattedText = renderPreviewFormatText('You: *~Test~*');
		expect(formattedText).toBe('You: Test');
	});
});

describe('convertAsciiEmoji = true', () => {
	beforeAll(() => {
		mockedStore.dispatch(
			setUser({
				settings: {
					preferences: {
						convertAsciiEmoji: true
					}
				}
			})
		);
	});

	test('Format unicode :)', () => {
		const formattedText = renderPreviewFormatText(':)');
		expect(formattedText).toBe('🙂');
	});

	test('Format unicode :) with text', () => {
		const formattedText = renderPreviewFormatText('Hello World :)');
		expect(formattedText).toBe('Hello World 🙂');
	});
});

describe('convertAsciiEmoji = false', () => {
	beforeAll(() => {
		mockedStore.dispatch(
			setUser({
				settings: {
					preferences: {
						convertAsciiEmoji: false
					}
				}
			})
		);
	});

	test('Keep unicode :)', () => {
		const formattedText = renderPreviewFormatText(':)');
		expect(formattedText).toBe(':)');
	});

	test('Keep unicode :) with text', () => {
		const formattedText = renderPreviewFormatText('Hello World :)');
		expect(formattedText).toBe('Hello World :)');
	});
});
