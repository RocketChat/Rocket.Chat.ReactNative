import { render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import Thread from '../Thread';
import { MessageProvider } from '../../stores/MessageStore';
import { MessageRoomProvider, pickMessageRoomState } from '../../stores/MessageRoomStore';
import { type TAnyMessageModel } from '../../../../definitions';
import { mockedStore } from '../../../../reducers/mockedStore';

const baseContextValue = {
	threadBadgeColor: undefined,
	toggleFollowThread: jest.fn(),
	user: { id: 'user1', username: 'user1' },
	replies: [],
	onThreadPress: jest.fn()
};

const buildItem = (overrides: Partial<TAnyMessageModel> = {}): TAnyMessageModel =>
	({ id: 'msg1', msg: 'hello', tcount: 3, tlm: undefined, tmid: undefined, ...overrides } as unknown as TAnyMessageModel);

const renderThread = (item: TAnyMessageModel) =>
	render(
		<Provider store={mockedStore}>
			<MessageRoomProvider {...pickMessageRoomState(baseContextValue)}>
				<MessageProvider item={item}>
					<Thread />
				</MessageProvider>
			</MessageRoomProvider>
		</Provider>
	);

describe('Thread — tlm-only update regression', () => {
	test('renders null when tlm is undefined, then shows button after tlm arrives (same tcount)', () => {
		const item = buildItem();
		const { queryByTestId, rerender, getByTestId } = renderThread(item);

		expect(queryByTestId('message-thread-button-hello')).toBeNull();

		const updatedItem = buildItem({ tlm: new Date('2024-01-01T00:00:00Z') });
		rerender(
			<Provider store={mockedStore}>
				<MessageRoomProvider {...pickMessageRoomState(baseContextValue)}>
					<MessageProvider item={updatedItem}>
						<Thread />
					</MessageProvider>
				</MessageRoomProvider>
			</Provider>
		);

		expect(getByTestId('message-thread-button-hello')).toBeTruthy();
	});
});
