import { act, render } from '@testing-library/react-native';

import { type IListPicker } from '~/containers/List/components/ListPicker';
import ListPicker from '../ListPicker';

const mockPicker = jest.fn();
jest.mock('~/containers/List/components/ListPicker', () => ({
	__esModule: true,
	default: (props: IListPicker) => {
		mockPicker(props);
		return null;
	}
}));

const latestPicker = (): IListPicker => mockPicker.mock.calls[mockPicker.mock.calls.length - 1][0];

const renderPicker = (onChangeValue: jest.Mock) =>
	render(
		<ListPicker
			preference='alsoSendThreadToChannel'
			value='always'
			title='Also_send_thread_message_to_channel_behavior'
			testID='preferences-view-enable-message-parser'
			onChangeValue={onChangeValue}
		/>
	);

describe('UserPreferencesView ListPicker', () => {
	beforeEach(() => mockPicker.mockClear());

	it('selects the current value and saves a new selection', () => {
		const onChangeValue = jest.fn();
		renderPicker(onChangeValue);
		expect(latestPicker().selection).toBe('always');
		expect(latestPicker().testID).toBe('preferences-view-enable-message-parser');

		act(() => latestPicker().onSelectionChange('never'));

		expect(onChangeValue).toHaveBeenCalledWith({ alsoSendThreadToChannel: 'never' }, expect.any(Function));
		expect(latestPicker().selection).toBe('never');
	});

	it('restores the previous value when saving fails', () => {
		const onChangeValue = jest.fn();
		renderPicker(onChangeValue);

		act(() => latestPicker().onSelectionChange('never'));
		act(() => onChangeValue.mock.calls[0][1]());

		expect(latestPicker().selection).toBe('always');
	});
});
