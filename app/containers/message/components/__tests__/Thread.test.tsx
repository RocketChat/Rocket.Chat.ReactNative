import { render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import Thread from '../Thread';
import { MessageProvider } from '../../stores/MessageStore';
import { MessageRoomProvider, type MessageRoomState } from '../../stores/MessageRoomStore';
import { type TAnyMessageModel } from '../../../../definitions';
import { mockedStore } from '../../../../reducers/mockedStore';

const baseContextValue: Partial<MessageRoomState> = {
	handlers: { toggleFollowThread: jest.fn(), onThreadPress: jest.fn() }
};

const buildItem = (overrides: Partial<TAnyMessageModel> = {}): TAnyMessageModel =>
	({ id: 'msg1', msg: 'hello', tcount: 3, tlm: undefined, tmid: undefined, ...overrides }) as unknown as TAnyMessageModel;

const renderThread = (item: TAnyMessageModel) =>
	render(
		<Provider store={mockedStore}>
			<MessageRoomProvider {...baseContextValue}>
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
				<MessageRoomProvider {...baseContextValue}>
					<MessageProvider item={updatedItem}>
						<Thread />
					</MessageProvider>
				</MessageRoomProvider>
			</Provider>
		);

		expect(getByTestId('message-thread-button-hello')).toBeTruthy();
	});
});

describe('Thread — follow affordance gating', () => {
	const renderWithHandlers = (handlers: Partial<MessageRoomState['handlers']>) =>
		render(
			<Provider store={mockedStore}>
				<MessageRoomProvider handlers={handlers}>
					<MessageProvider item={buildItem({ tlm: new Date('2024-01-01T00:00:00Z') })}>
						<Thread />
					</MessageProvider>
				</MessageRoomProvider>
			</Provider>
		);

	test('shows the follow toggle when a toggleFollowThread handler was supplied', () => {
		const { getByLabelText } = renderWithHandlers({ toggleFollowThread: jest.fn(), onThreadPress: jest.fn() });

		expect(getByLabelText('Follow thread')).toBeTruthy();
	});

	test('hides the follow toggle when no toggleFollowThread handler was supplied', () => {
		const { queryByLabelText } = renderWithHandlers({ onThreadPress: jest.fn() });

		expect(queryByLabelText('Follow thread')).toBeNull();
	});
});
