import React from 'react';
import { act, fireEvent, render, waitFor, screen } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import { MessageComposer } from './MessageComposer';
import { setPermissions } from '../../actions/permissions';
import { addSettings } from '../../actions/settings';
import { selectServerRequest } from '../../actions/server';
import { setUser } from '../../actions/login';
import { mockedStore } from '../../reducers/mockedStore';
import { IPermissionsState } from '../../reducers/permissions';
import { IMessage, TAnyMessageModel } from '../../definitions';
import { colors } from '../../lib/constants';
import { emitter } from './emitter';
import { RoomContext } from '../../views/RoomView/context';

const initialStoreState = () => {
	const baseUrl = 'https://open.rocket.chat';
	mockedStore.dispatch(selectServerRequest(baseUrl, '6.4.0'));
	mockedStore.dispatch(setUser({ id: 'abc', username: 'rocket.cat', name: 'Rocket Cat', roles: ['user'] }));

	const permissions: IPermissionsState = { 'mobile-upload-file': ['user'] };
	mockedStore.dispatch(setPermissions(permissions));
	mockedStore.dispatch(addSettings({ Message_AudioRecorderEnabled: true }));
};
initialStoreState();

const Render = () => (
	<Provider store={mockedStore}>
		<MessageComposer rid={''} editing={false} onSendMessage={jest.fn()} sharing={false} />
	</Provider>
);

test('renders correctly', () => {
	render(<Render />);
	expect(screen.getByTestId('message-composer-input')).toBeOnTheScreen();
	expect(screen.getByTestId('message-composer-actions')).toBeOnTheScreen();
	expect(screen.getByTestId('message-composer-send-audio')).toBeOnTheScreen();
	expect(screen.toJSON()).toMatchSnapshot();
});

test('renders correctly with audio recorder disabled', () => {
	mockedStore.dispatch(addSettings({ Message_AudioRecorderEnabled: false }));
	render(<Render />);
	expect(screen.queryByTestId('message-composer-send-audio')).toBeNull();
	expect(screen.toJSON()).toMatchSnapshot();
});

test('renders correctly without audio upload permissions', () => {
	mockedStore.dispatch(setPermissions({}));
	render(<Render />);
	expect(screen.queryByTestId('message-composer-send-audio')).toBeNull();
	expect(screen.toJSON()).toMatchSnapshot();
});

test('renders correctly with audio recorder disabled and without audio upload permissions', () => {
	mockedStore.dispatch(addSettings({ Message_AudioRecorderEnabled: false }));
	mockedStore.dispatch(setPermissions({}));
	render(<Render />);
	expect(screen.queryByTestId('message-composer-send-audio')).toBeNull();
	expect(screen.toJSON()).toMatchSnapshot();
});

test('renders toolbar when focused', async () => {
	initialStoreState();
	render(<Render />);
	expect(screen.getByTestId('message-composer-actions')).toBeOnTheScreen();
	expect(screen.getByTestId('message-composer-send-audio')).toBeOnTheScreen();
	expect(screen.queryByTestId('message-composer-open-emoji')).toBeNull();
	expect(screen.queryByTestId('message-composer-markdown')).toBeNull();
	expect(screen.queryByTestId('message-composer-mention')).toBeNull();

	await act(async () => {
		await fireEvent(screen.getByTestId('message-composer-input'), 'focus');
	});
	expect(screen.getByTestId('message-composer-actions')).toBeOnTheScreen();
	expect(screen.getByTestId('message-composer-send-audio')).toBeOnTheScreen();
	expect(screen.getByTestId('message-composer-open-emoji')).toBeOnTheScreen();
	expect(screen.getByTestId('message-composer-markdown')).toBeOnTheScreen();
	expect(screen.getByTestId('message-composer-mention')).toBeOnTheScreen();
	expect(screen.toJSON()).toMatchSnapshot();
});

test('send message', async () => {
	const onSendMessage = jest.fn();
	render(
		<Provider store={mockedStore}>
			<MessageComposer rid={''} editing={false} onSendMessage={onSendMessage} sharing={false} />
		</Provider>
	);
	expect(screen.getByTestId('message-composer-send-audio')).toBeOnTheScreen();
	await act(async () => {
		await fireEvent.changeText(screen.getByTestId('message-composer-input'), 'test');
		expect(screen.queryByTestId('message-composer-send-audio')).toBeNull();
		expect(screen.getByTestId('message-composer-send')).toBeOnTheScreen();
		await fireEvent.press(screen.getByTestId('message-composer-send'));
	});
	await waitFor(() => expect(onSendMessage).toHaveBeenCalledTimes(1));
	expect(onSendMessage).toHaveBeenCalledWith('test');
	expect(screen.toJSON()).toMatchSnapshot();
});

test('tap actions from toolbar', async () => {
	render(<Render />);

	await act(async () => {
		await fireEvent(screen.getByTestId('message-composer-input'), 'focus');
		await fireEvent.press(screen.getByTestId('message-composer-actions'));
	});
	expect(screen.toJSON()).toMatchSnapshot();
});

test('tap emoji', async () => {
	render(<Render />);

	await act(async () => {
		await fireEvent(screen.getByTestId('message-composer-input'), 'focus');
		await fireEvent.press(screen.getByTestId('message-composer-open-emoji'));
	});
	expect(screen.getByTestId('message-composer-close-emoji')).toBeOnTheScreen();
	expect(screen.toJSON()).toMatchSnapshot();
});

test('tap markdown', async () => {
	render(<Render />);

	await act(async () => {
		await fireEvent(screen.getByTestId('message-composer-input'), 'focus');
		// await fireEvent.press(screen.getByTestId('message-composer-markdown'));
	});
	expect(screen.toJSON()).toMatchSnapshot();
});

test('tap mention', async () => {
	render(<Render />);

	await act(async () => {
		await fireEvent(screen.getByTestId('message-composer-input'), 'focus');
		// await fireEvent.press(screen.getByTestId('message-composer-mention'));
	});
	expect(screen.toJSON()).toMatchSnapshot();
});

describe('edit message', () => {
	const onSendMessage = jest.fn();
	const editCancel = jest.fn();
	const editRequest = jest.fn();
	const msg = 'to edit';
	const id = 'messageId';
	const rid = 'subscriptionId';
	beforeEach(() => {
		const messageToEdit = {
			id,
			subscription: {
				// @ts-ignore TODO: we can remove this after we merge a PR separating IMessage vs IMessageFromServer
				id: rid
			},
			msg
		} as TAnyMessageModel;
		render(
			<Provider store={mockedStore}>
				<MessageComposer
					rid={''}
					editing={true}
					message={messageToEdit}
					editCancel={editCancel}
					onSendMessage={onSendMessage}
					editRequest={editRequest}
					sharing={false}
				/>
			</Provider>
		);

		// TODO: This is not cool, but it was the only way I could find to properly trigger the event
		// We can think of a better way to do this before merging to develop
		act(() => emitter.emit('setMicOrSend', 'send'));
	});
	test('init', () => {
		// screen.debug();
		expect(screen.getByTestId('message-composer')).toHaveStyle({ backgroundColor: colors.light.statusBackgroundWarning2 });
		expect(screen.getByTestId('message-composer-actions')).toBeOnTheScreen();
		expect(screen.queryByTestId('message-composer-send-audio')).toBeNull();
		expect(screen.getByTestId('message-composer-cancel-edit')).toBeOnTheScreen();
	});
	test('cancel', () => {
		expect(screen.getByTestId('message-composer')).toHaveStyle({ backgroundColor: colors.light.statusBackgroundWarning2 });
		fireEvent.press(screen.getByTestId('message-composer-cancel-edit'));
		expect(editCancel).toHaveBeenCalledTimes(1);
	});
	test('send', () => {
		expect(screen.getByTestId('message-composer')).toHaveStyle({ backgroundColor: colors.light.statusBackgroundWarning2 });
		fireEvent.press(screen.getByTestId('message-composer-send'));
		expect(editRequest).toHaveBeenCalledTimes(1);
		expect(editRequest).toHaveBeenCalledWith({ id, msg, rid });
	});
});

const messageIds = ['abc', 'def'];
jest.mock('./hooks/useMessage', () => ({
	useMessage: (messageId: string) => {
		if (!messageIds.includes(messageId)) {
			return null;
		}
		const message = {
			id: messageId,
			msg: 'quote this',
			u: {
				username: 'rocket.cat'
			}
		} as IMessage;
		return message;
	}
}));

jest.mock('../../lib/store/auxStore', () => ({
	store: {
		getState: () => mockedStore.getState()
	}
}));

describe('Quote', () => {
	test('Adding/removing quotes', () => {
		const onRemoveQuoteMessage = jest.fn();

		// Render without quotes
		const { rerender } = render(
			<Provider store={mockedStore}>
				<RoomContext.Provider value={{ action: null, selectedMessages: [], onRemoveQuoteMessage }}>
					<MessageComposer rid={''} editing={false} onSendMessage={jest.fn()} sharing={false} />
				</RoomContext.Provider>
			</Provider>
		);
		expect(screen.queryByTestId('composer-quote-abc')).toBeNull();
		expect(screen.queryByTestId('composer-quote-def')).toBeNull();
		expect(screen.toJSON()).toMatchSnapshot();

		// Add a quote
		rerender(
			<Provider store={mockedStore}>
				<RoomContext.Provider value={{ action: 'quote', selectedMessages: ['abc'], onRemoveQuoteMessage }}>
					<MessageComposer rid={''} editing={false} onSendMessage={jest.fn()} sharing={false} />
				</RoomContext.Provider>
			</Provider>
		);
		expect(screen.getByTestId('composer-quote-abc')).toBeOnTheScreen();
		expect(screen.queryByTestId('composer-quote-def')).toBeNull();
		expect(screen.toJSON()).toMatchSnapshot();

		// Add another quote
		rerender(
			<Provider store={mockedStore}>
				<RoomContext.Provider value={{ action: 'quote', selectedMessages: ['abc', 'def'], onRemoveQuoteMessage }}>
					<MessageComposer rid={''} editing={false} onSendMessage={jest.fn()} sharing={false} />
				</RoomContext.Provider>
			</Provider>
		);
		expect(screen.getByTestId('composer-quote-abc')).toBeOnTheScreen();
		expect(screen.getByTestId('composer-quote-def')).toBeOnTheScreen();
		expect(screen.toJSON()).toMatchSnapshot();

		// Remove a quote
		fireEvent.press(screen.getByTestId('composer-quote-remove-def'));
		expect(onRemoveQuoteMessage).toHaveBeenCalledTimes(1);
		expect(onRemoveQuoteMessage).toHaveBeenCalledWith('def');
	});

	// TODO: need to create proper mocks for getMessageById and getPermalinkMessage
	// test('Send message with a quote', async () => {});
});
