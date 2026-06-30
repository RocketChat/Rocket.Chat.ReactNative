import { render } from '@testing-library/react-native';

import Thread from './Thread';
import MessageContext from './Context';

const baseContextValue = {
	threadBadgeColor: undefined,
	toggleFollowThread: jest.fn(),
	user: { id: 'user1', username: 'user1' },
	replies: [],
	onThreadPress: jest.fn()
};

const renderThread = (props: Parameters<typeof Thread>[0]) =>
	render(
		<MessageContext.Provider value={baseContextValue}>
			<Thread {...props} />
		</MessageContext.Provider>
	);

describe('Thread — tlm-only update regression', () => {
	test('renders null when tlm is undefined, then shows button after tlm arrives (same tcount)', () => {
		const { queryByTestId, rerender, getByTestId } = renderThread({
			msg: 'hello',
			tcount: 3,
			tlm: undefined,
			isThreadRoom: false,
			id: 'msg1'
		});

		expect(queryByTestId('message-thread-button-hello')).toBeNull();

		rerender(
			<MessageContext.Provider value={baseContextValue}>
				<Thread msg='hello' tcount={3} tlm={new Date('2024-01-01T00:00:00Z')} isThreadRoom={false} id='msg1' />
			</MessageContext.Provider>
		);

		expect(getByTestId('message-thread-button-hello')).toBeTruthy();
	});
});
