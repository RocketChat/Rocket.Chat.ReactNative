import { Provider } from 'react-redux';
import { render, fireEvent } from '@testing-library/react-native';

import MessageContainer from './index';
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

const createMockMessage = (overrides: Record<string, any> = {}): TAnyMessageModel =>
	({
		id: 'msg-1',
		msg: 'Hello World',
		t: undefined,
		ts: new Date(),
		u: { _id: 'user-1', username: 'testuser', name: 'Test User' },
		alias: undefined,
		groupable: true,
		avatar: undefined,
		emoji: undefined,
		attachments: undefined,
		urls: undefined,
		status: undefined,
		pinned: undefined,
		editedBy: undefined,
		reactions: undefined,
		role: undefined,
		drid: undefined,
		dcount: undefined,
		dlm: undefined,
		tmid: undefined,
		tcount: undefined,
		tlm: undefined,
		replies: undefined,
		mentions: undefined,
		channels: undefined,
		unread: undefined,
		autoTranslate: undefined,
		translations: undefined,
		tmsg: undefined,
		blocks: undefined,
		e2e: undefined,
		md: undefined,
		comment: undefined,
		experimentalSubscribe: jest.fn(() => jest.fn()),
		...overrides
	} as unknown as TAnyMessageModel);

const baseProps = {
	user: { id: 'user-1', username: 'testuser', token: 'token' },
	rid: 'room-1',
	baseUrl: 'https://open.rocket.chat',
	getCustomEmoji: jest.fn(() => null)
};

const renderContainer = (itemOverrides: Record<string, any> = {}, propOverrides: Record<string, any> = {}) =>
	render(
		<Provider store={mockedStore}>
			<MessageContainer item={createMockMessage(itemOverrides)} {...baseProps} {...propOverrides} />
		</Provider>
	);

it('renders a normal message without crashing', () => {
	const { getByTestId } = renderContainer();
	expect(getByTestId('message-msg-1')).toBeTruthy();
});

it('renders the message text', () => {
	const { getByText } = renderContainer({ msg: 'Hello World' });
	expect(getByText('Hello World')).toBeTruthy();
});

it('reveals an ignored message when tapped', () => {
	const { getByTestId, queryByTestId } = renderContainer({ msg: 'Hello World' }, { isIgnored: true });
	expect(getByTestId('message-ignored-Hello World')).toBeTruthy();
	fireEvent.press(getByTestId('message-ignored-Hello World'));
	expect(queryByTestId('message-ignored-Hello World')).toBeNull();
});

it('fires the onLongPress callback when long-pressed', () => {
	const onLongPress = jest.fn();
	const { getByTestId } = renderContainer({}, { onLongPress });
	fireEvent(getByTestId('message-msg-1'), 'longPress');
	expect(onLongPress).toHaveBeenCalledTimes(1);
});
