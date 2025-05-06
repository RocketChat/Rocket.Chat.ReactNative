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

describe('Format preview message', () => {
	test('empty to be empty', () => {
		const formattedText = usePreviewFormatText('');
		expect(formattedText).toBe('');
	});
	test('A123 to be A123', () => {
		const formattedText = usePreviewFormatText('A123');
		expect(formattedText).toBe('A123');
	});
	test('Format <http://link|Text> to be Text', () => {
		const formattedText = usePreviewFormatText('<http://link|Text>');
		expect(formattedText).toBe('Text');
	});
	test('Format "[ ](https://open.rocket.chat/) Test" to be Test', () => {
		const formattedText = usePreviewFormatText('[ ](https://open.rocket.chat/) Test');
		expect(formattedText).toEqual('Test');
	});
	test('Format "[Open](https://open.rocket.chat/) Test" to be Test', () => {
		const formattedText = usePreviewFormatText('[Open](https://open.rocket.chat/) Test');
		expect(formattedText).toBe('Open Test');
	});
	test('render test (arabic)', () => {
		const formattedText = usePreviewFormatText('[ ](https://open.rocket.chat/) اختبا');
		expect(formattedText).toBe('اختبا');
	});
	test('render test (russian)', () => {
		const formattedText = usePreviewFormatText('[ ](https://open.rocket.chat/) тест123');
		expect(formattedText).toBe('тест123');
	});
	test('Format a quote message as last message "You: [ ](https://open.rocket.chat/group/channel?msg=nrTDSw96IhtF3iN4K) \nTest"', () => {
		const formattedText = usePreviewFormatText('You: [ ](https://open.rocket.chat/group/channel?msg=nrTDSw96IhtF3iN4K) \nTest');
		expect(formattedText).toBe('You: Test');
	});
});
