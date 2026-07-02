import { render } from '@testing-library/react-native';

import Thread from './Thread';
import { MessageProvider } from './MessageStore';
import { MessageRoomProvider, pickMessageRoomState } from './MessageRoomStore';
import { type TAnyMessageModel } from '../../definitions';

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
		<MessageRoomProvider {...pickMessageRoomState(baseContextValue)}>
			<MessageProvider item={item}>
				<Thread />
			</MessageProvider>
		</MessageRoomProvider>
	);

describe('Thread — tlm-only update regression', () => {
	test('renders null when tlm is undefined, then shows button after tlm arrives (same tcount)', () => {
		const item = buildItem();
		const { queryByTestId, rerender, getByTestId } = renderThread(item);

		expect(queryByTestId('message-thread-button-hello')).toBeNull();

		const updatedItem = buildItem({ tlm: new Date('2024-01-01T00:00:00Z') });
		rerender(
			<MessageRoomProvider {...pickMessageRoomState(baseContextValue)}>
				<MessageProvider item={updatedItem}>
					<Thread />
				</MessageProvider>
			</MessageRoomProvider>
		);

		expect(getByTestId('message-thread-button-hello')).toBeTruthy();
	});
});
