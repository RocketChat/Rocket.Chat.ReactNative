import { render, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import RepliedThread from '../RepliedThread';
import { MessageProvider } from '../../stores/MessageStore';
import { MessageRoomProvider } from '../../stores/MessageRoomStore';
import { type TAnyMessageModel } from '../../../../definitions';
import { mockedStore } from '../../../../reducers/mockedStore';
import { E2E_MESSAGE_TYPE, E2E_STATUS } from '../../../../lib/constants/keys';

const buildItem = (overrides: Partial<TAnyMessageModel> = {}): TAnyMessageModel =>
	({ id: 'msg1', tmid: 'thread1', tmsg: 'original reply', ...overrides }) as unknown as TAnyMessageModel;

const renderRepliedThread = (item: TAnyMessageModel, fetchThreadName?: jest.Mock) =>
	render(
		<Provider store={mockedStore}>
			<MessageRoomProvider handlers={{ fetchThreadName }}>
				<MessageProvider item={item}>
					<RepliedThread isHeader />
				</MessageProvider>
			</MessageRoomProvider>
		</Provider>
	);

describe('RepliedThread', () => {
	test('renders the encrypted placeholder when the message is encrypted, ignoring tmsg', () => {
		const item = buildItem({ t: E2E_MESSAGE_TYPE, e2e: E2E_STATUS.PENDING, tmsg: 'plaintext should not show' });
		const { getByTestId, queryByTestId } = renderRepliedThread(item);

		expect(getByTestId('message-thread-replied-on-Encrypted message')).toBeTruthy();
		expect(queryByTestId('message-thread-replied-on-plaintext should not show')).toBeNull();
	});

	test('fetches and renders the thread name when tmsg is missing', async () => {
		const fetchThreadName = jest.fn().mockResolvedValue('fetched thread name');
		const item = buildItem({ tmsg: undefined });
		const { getByTestId } = renderRepliedThread(item, fetchThreadName);

		await waitFor(() => expect(getByTestId('message-thread-replied-on-fetched thread name')).toBeTruthy());
		expect(fetchThreadName).toHaveBeenCalledWith('thread1', 'msg1');
	});

	test('re-fetches when tmid/id change without remounting', async () => {
		const fetchThreadName = jest.fn().mockResolvedValueOnce('first thread name').mockResolvedValueOnce('second thread name');
		const item = buildItem({ tmid: 'thread1', id: 'msg1', tmsg: undefined });
		const { getByTestId, rerender } = renderRepliedThread(item, fetchThreadName);

		await waitFor(() => expect(getByTestId('message-thread-replied-on-first thread name')).toBeTruthy());

		const updatedItem = buildItem({ tmid: 'thread2', id: 'msg2', tmsg: undefined });
		rerender(
			<Provider store={mockedStore}>
				<MessageRoomProvider handlers={{ fetchThreadName }}>
					<MessageProvider item={updatedItem}>
						<RepliedThread isHeader />
					</MessageProvider>
				</MessageRoomProvider>
			</Provider>
		);

		await waitFor(() => expect(getByTestId('message-thread-replied-on-second thread name')).toBeTruthy());
		expect(fetchThreadName).toHaveBeenLastCalledWith('thread2', 'msg2');
	});

	test('updates the display when tmsg/isEncrypted change without remounting', () => {
		const item = buildItem({ tmsg: 'first reply' });
		const { getByTestId, rerender } = renderRepliedThread(item);

		expect(getByTestId('message-thread-replied-on-first reply')).toBeTruthy();

		const updatedItem = buildItem({ tmsg: 'second reply' });
		rerender(
			<Provider store={mockedStore}>
				<MessageRoomProvider>
					<MessageProvider item={updatedItem}>
						<RepliedThread isHeader />
					</MessageProvider>
				</MessageRoomProvider>
			</Provider>
		);

		expect(getByTestId('message-thread-replied-on-second reply')).toBeTruthy();
	});
});
