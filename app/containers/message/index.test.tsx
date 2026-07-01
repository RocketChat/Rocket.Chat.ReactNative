import { act } from 'react';
import { fireEvent } from '@testing-library/react-native';

import MessageContainer from './index';
import { type TAnyMessageModel } from '../../definitions';
import { createInteractionStore, InteractionStoreContext } from '../../views/RoomView/InteractionStore';
import { renderWithMessageProviders } from './testHelpers';
import { pickMessageRoomState } from './MessageRoomStore';

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
	rid: 'room-1'
};

const renderContainer = (itemOverrides: Record<string, any> = {}, propOverrides: Record<string, any> = {}) => {
	const props = { ...baseProps, ...propOverrides };
	return renderWithMessageProviders(<MessageContainer item={createMockMessage(itemOverrides)} {...props} />, {
		room: pickMessageRoomState(props)
	});
};

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

describe('edit highlight reacts to InteractionStore', () => {
	it('shows editing testID when the store marks this message as being edited', () => {
		const store = createInteractionStore({ action: 'edit', selectedMessages: ['msg-1'] });
		const item = createMockMessage({ id: 'msg-1' });
		const { getByTestId } = renderWithMessageProviders(
			<InteractionStoreContext.Provider value={store}>
				<MessageContainer item={item} {...baseProps} />
			</InteractionStoreContext.Provider>,
			{ room: pickMessageRoomState(baseProps) }
		);
		expect(getByTestId('message-editing-msg-1')).toBeTruthy();
	});

	it('removes editing testID when the store resets', async () => {
		const store = createInteractionStore({ action: 'edit', selectedMessages: ['msg-1'] });
		const item = createMockMessage({ id: 'msg-1' });
		const { queryByTestId } = renderWithMessageProviders(
			<InteractionStoreContext.Provider value={store}>
				<MessageContainer item={item} {...baseProps} />
			</InteractionStoreContext.Provider>,
			{ room: pickMessageRoomState(baseProps) }
		);
		await act(() => {
			store.getState().actions.reset();
		});
		expect(queryByTestId('message-editing-msg-1')).toBeNull();
	});
});
