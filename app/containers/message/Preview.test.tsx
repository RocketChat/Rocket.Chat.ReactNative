import { Provider } from 'react-redux';
import { render } from '@testing-library/react-native';

import MessagePreview from './Preview';
import { mockedStore } from '../../reducers/mockedStore';
import { type TAnyMessageModel } from '../../definitions';

jest.mock('./Touch', () => {
	const { forwardRef } = require('react');
	const { TouchableOpacity } = require('react-native');
	return forwardRef(({ children, onPress, onLongPress, ...props }: any, ref: any) => (
		<TouchableOpacity ref={ref} onPress={onPress} onLongPress={onLongPress} {...props}>
			{children}
		</TouchableOpacity>
	));
});

const mockMessage = {
	id: 'msg-1',
	rid: 'room-1',
	msg: 'Hello World',
	u: { _id: 'user-1', username: 'testuser', name: 'Test User' },
	ts: new Date(),
	experimentalSubscribe: jest.fn(() => jest.fn())
} as unknown as TAnyMessageModel;

// MessagePreview renders <Message> as the only surface outside RoomView/MessagesView/SearchMessagesView.
// The message subtree's room hooks throw when mounted without a MessageRoomProvider, so it must self-provide.
describe('MessagePreview', () => {
	it('renders without a MessageRoomProvider crash', () => {
		expect(() =>
			render(
				<Provider store={mockedStore}>
					<MessagePreview message={mockMessage} />
				</Provider>
			)
		).not.toThrow();
	});

	it('renders the message text', () => {
		const { getByText } = render(
			<Provider store={mockedStore}>
				<MessagePreview message={mockMessage} />
			</Provider>
		);
		expect(getByText('Hello World')).toBeTruthy();
	});
});
