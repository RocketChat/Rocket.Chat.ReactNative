import { act, render } from '@testing-library/react-native';

import { NativeListContext } from '~/containers/List/native/context';
import { type INativeListPicker } from '~/containers/List/native/types';
import ListPicker from '../ListPicker';

const mockPicker = jest.fn();
jest.mock('~/containers/List/native/Picker', () => ({
	__esModule: true,
	default: (props: INativeListPicker) => {
		mockPicker(props);
		return null;
	}
}));

const latestPicker = (): INativeListPicker => mockPicker.mock.calls[mockPicker.mock.calls.length - 1][0];

const renderNative = (onChangeValue: jest.Mock) =>
	render(
		<NativeListContext.Provider value='native'>
			<ListPicker
				preference='alsoSendThreadToChannel'
				value='always'
				title='Also_send_thread_message_to_channel_behavior'
				testID='preferences-view-enable-message-parser'
				onChangeValue={onChangeValue}
			/>
		</NativeListContext.Provider>
	);

describe('UserPreferencesView ListPicker in a native list', () => {
	beforeEach(() => mockPicker.mockClear());

	it('selects the current value and saves a new selection', () => {
		const onChangeValue = jest.fn();
		renderNative(onChangeValue);
		expect(latestPicker().selection).toBe('always');
		expect(latestPicker().testID).toBe('preferences-view-enable-message-parser');

		act(() => latestPicker().onSelectionChange('never'));

		expect(onChangeValue).toHaveBeenCalledWith({ alsoSendThreadToChannel: 'never' }, expect.any(Function));
		expect(latestPicker().selection).toBe('never');
	});

	it('restores the previous value when saving fails', () => {
		const onChangeValue = jest.fn();
		renderNative(onChangeValue);

		act(() => latestPicker().onSelectionChange('never'));
		act(() => onChangeValue.mock.calls[0][1]());

		expect(latestPicker().selection).toBe('always');
	});
});
