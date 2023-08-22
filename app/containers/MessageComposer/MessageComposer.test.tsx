import React from 'react';
import { act, fireEvent, render, waitFor, screen } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import { MessageComposerContainer } from './MessageComposerContainer';
import { setPermissions } from '../../actions/permissions';
import { addSettings } from '../../actions/settings';
import { selectServerRequest } from '../../actions/server';
import { setUser } from '../../actions/login';
import { mockedStore } from '../../reducers/mockedStore';
import { IPermissionsState } from '../../reducers/permissions';
import { IMessage } from '../../definitions';
import { colors } from '../../lib/constants';
import { IRoomContext, RoomContext } from '../../views/RoomView/context';
import { TMarkdownStyle } from './interfaces';

const initialStoreState = () => {
	const baseUrl = 'https://open.rocket.chat';
	mockedStore.dispatch(selectServerRequest(baseUrl, '6.4.0'));
	mockedStore.dispatch(setUser({ id: 'abc', username: 'rocket.cat', name: 'Rocket Cat', roles: ['user'] }));

	const permissions: IPermissionsState = { 'mobile-upload-file': ['user'] };
	mockedStore.dispatch(setPermissions(permissions));
	mockedStore.dispatch(addSettings({ Message_AudioRecorderEnabled: true }));
};
initialStoreState();

const initialContext = {
	rid: '',
	tmid: undefined,
	sharing: false,
	action: null,
	selectedMessages: [],
	editCancel: jest.fn(),
	editRequest: jest.fn(),
	onSendMessage: jest.fn(),
	onRemoveQuoteMessage: jest.fn()
};

const Render = ({ context }: { context?: Partial<IRoomContext> }) => (
	<Provider store={mockedStore}>
		<RoomContext.Provider value={{ ...initialContext, ...context }}>
			<MessageComposerContainer />
		</RoomContext.Provider>
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
	expect(screen.queryByTestId('message-composer-open-markdown')).toBeNull();
	expect(screen.queryByTestId('message-composer-mention')).toBeNull();

	await act(async () => {
		await fireEvent(screen.getByTestId('message-composer-input'), 'focus');
	});
	expect(screen.getByTestId('message-composer-actions')).toBeOnTheScreen();
	expect(screen.getByTestId('message-composer-send-audio')).toBeOnTheScreen();
	expect(screen.getByTestId('message-composer-open-emoji')).toBeOnTheScreen();
	expect(screen.getByTestId('message-composer-open-markdown')).toBeOnTheScreen();
	expect(screen.getByTestId('message-composer-mention')).toBeOnTheScreen();
	expect(screen.toJSON()).toMatchSnapshot();
});

test('send message', async () => {
	const onSendMessage = jest.fn();
	render(
		<Provider store={mockedStore}>
			<RoomContext.Provider value={{ ...initialContext, onSendMessage }}>
				<MessageComposerContainer />
			</RoomContext.Provider>
		</Provider>
	);
	expect(screen.getByTestId('message-composer-send-audio')).toBeOnTheScreen();
	await act(async () => {
		await fireEvent.changeText(screen.getByTestId('message-composer-input'), 'test');
		expect(screen.queryByTestId('message-composer-send-audio')).toBeNull();
		expect(screen.getByTestId('message-composer-send')).toBeOnTheScreen();
		await fireEvent.press(screen.getByTestId('message-composer-send'));
	});
	expect(onSendMessage).toHaveBeenCalledTimes(1);
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

describe('Markdown', () => {
	test('tap markdown', async () => {
		render(<Render />);

		await act(async () => {
			await fireEvent(screen.getByTestId('message-composer-input'), 'focus');
			await fireEvent.press(screen.getByTestId('message-composer-open-markdown'));
		});
		expect(screen.getByTestId('message-composer-close-markdown')).toBeOnTheScreen();
		expect(screen.getByTestId('message-composer-bold')).toBeOnTheScreen();
		expect(screen.getByTestId('message-composer-italic')).toBeOnTheScreen();
		expect(screen.getByTestId('message-composer-strike')).toBeOnTheScreen();
		expect(screen.getByTestId('message-composer-code')).toBeOnTheScreen();
		expect(screen.getByTestId('message-composer-code-block')).toBeOnTheScreen();
		expect(screen.toJSON()).toMatchSnapshot();
	});

	test('tap bold', async () => {
		const onSendMessage = jest.fn();
		render(<Render context={{ onSendMessage }} />);

		await act(async () => {
			await fireEvent(screen.getByTestId('message-composer-input'), 'focus');
			await fireEvent.press(screen.getByTestId('message-composer-open-markdown'));
			await fireEvent.press(screen.getByTestId('message-composer-bold'));
			await fireEvent.press(screen.getByTestId('message-composer-send'));
		});
		expect(onSendMessage).toHaveBeenCalledTimes(1);
		expect(onSendMessage).toHaveBeenCalledWith('**');
		expect(screen.toJSON()).toMatchSnapshot();
	});

	test('type test and tap bold', async () => {
		const onSendMessage = jest.fn();
		render(<Render context={{ onSendMessage }} />);

		await act(async () => {
			await fireEvent.changeText(screen.getByTestId('message-composer-input'), 'test');
			await fireEvent(screen.getByTestId('message-composer-input'), 'focus');
			await fireEvent(screen.getByTestId('message-composer-input'), 'selectionChange', {
				nativeEvent: { selection: { start: 0, end: 4 } }
			});
			await fireEvent.press(screen.getByTestId('message-composer-open-markdown'));
			await fireEvent.press(screen.getByTestId('message-composer-bold'));
			await fireEvent.press(screen.getByTestId('message-composer-send'));
		});
		expect(onSendMessage).toHaveBeenCalledTimes(1);
		expect(onSendMessage).toHaveBeenCalledWith('*test*');
		expect(screen.toJSON()).toMatchSnapshot();
	});

	test('tap italic', async () => {
		const onSendMessage = jest.fn();
		render(<Render context={{ onSendMessage }} />);

		await act(async () => {
			await fireEvent(screen.getByTestId('message-composer-input'), 'focus');
			await fireEvent.press(screen.getByTestId('message-composer-open-markdown'));
			await fireEvent.press(screen.getByTestId('message-composer-italic'));
			await fireEvent.press(screen.getByTestId('message-composer-send'));
		});
		expect(onSendMessage).toHaveBeenCalledTimes(1);
		expect(onSendMessage).toHaveBeenCalledWith('__');
		expect(screen.toJSON()).toMatchSnapshot();
	});

	test('type test and tap italic', async () => {
		const onSendMessage = jest.fn();
		render(<Render context={{ onSendMessage }} />);

		await act(async () => {
			await fireEvent.changeText(screen.getByTestId('message-composer-input'), 'test');
			await fireEvent(screen.getByTestId('message-composer-input'), 'focus');
			await fireEvent(screen.getByTestId('message-composer-input'), 'selectionChange', {
				nativeEvent: { selection: { start: 0, end: 4 } }
			});
			await fireEvent.press(screen.getByTestId('message-composer-open-markdown'));
			await fireEvent.press(screen.getByTestId('message-composer-italic'));
			await fireEvent.press(screen.getByTestId('message-composer-send'));
		});
		expect(onSendMessage).toHaveBeenCalledTimes(1);
		expect(onSendMessage).toHaveBeenCalledWith('_test_');
		expect(screen.toJSON()).toMatchSnapshot();
	});

	test('tap strike', async () => {
		const onSendMessage = jest.fn();
		render(<Render context={{ onSendMessage }} />);

		await act(async () => {
			await fireEvent(screen.getByTestId('message-composer-input'), 'focus');
			await fireEvent.press(screen.getByTestId('message-composer-open-markdown'));
			await fireEvent.press(screen.getByTestId('message-composer-strike'));
			await fireEvent.press(screen.getByTestId('message-composer-send'));
		});
		expect(onSendMessage).toHaveBeenCalledTimes(1);
		expect(onSendMessage).toHaveBeenCalledWith('~~');
		expect(screen.toJSON()).toMatchSnapshot();
	});

	test('type test and tap strike', async () => {
		const onSendMessage = jest.fn();
		render(<Render context={{ onSendMessage }} />);

		await act(async () => {
			await fireEvent.changeText(screen.getByTestId('message-composer-input'), 'test');
			await fireEvent(screen.getByTestId('message-composer-input'), 'focus');
			await fireEvent(screen.getByTestId('message-composer-input'), 'selectionChange', {
				nativeEvent: { selection: { start: 0, end: 4 } }
			});
			await fireEvent.press(screen.getByTestId('message-composer-open-markdown'));
			await fireEvent.press(screen.getByTestId('message-composer-strike'));
			await fireEvent.press(screen.getByTestId('message-composer-send'));
		});
		expect(onSendMessage).toHaveBeenCalledTimes(1);
		expect(onSendMessage).toHaveBeenCalledWith('~test~');
		expect(screen.toJSON()).toMatchSnapshot();
	});

	test('tap code', async () => {
		const onSendMessage = jest.fn();
		render(<Render context={{ onSendMessage }} />);

		await act(async () => {
			await fireEvent(screen.getByTestId('message-composer-input'), 'focus');
			await fireEvent.press(screen.getByTestId('message-composer-open-markdown'));
			await fireEvent.press(screen.getByTestId('message-composer-code'));
			await fireEvent.press(screen.getByTestId('message-composer-send'));
		});
		expect(onSendMessage).toHaveBeenCalledTimes(1);
		expect(onSendMessage).toHaveBeenCalledWith('``');
		expect(screen.toJSON()).toMatchSnapshot();
	});

	test('type test and tap code', async () => {
		const onSendMessage = jest.fn();
		render(<Render context={{ onSendMessage }} />);

		await act(async () => {
			await fireEvent.changeText(screen.getByTestId('message-composer-input'), 'test');
			await fireEvent(screen.getByTestId('message-composer-input'), 'focus');
			await fireEvent(screen.getByTestId('message-composer-input'), 'selectionChange', {
				nativeEvent: { selection: { start: 0, end: 4 } }
			});
			await fireEvent.press(screen.getByTestId('message-composer-open-markdown'));
			await fireEvent.press(screen.getByTestId('message-composer-code'));
			await fireEvent.press(screen.getByTestId('message-composer-send'));
		});
		expect(onSendMessage).toHaveBeenCalledTimes(1);
		expect(onSendMessage).toHaveBeenCalledWith('`test`');
		expect(screen.toJSON()).toMatchSnapshot();
	});

	test('tap code-block', async () => {
		const onSendMessage = jest.fn();
		render(<Render context={{ onSendMessage }} />);

		await act(async () => {
			await fireEvent(screen.getByTestId('message-composer-input'), 'focus');
			await fireEvent.press(screen.getByTestId('message-composer-open-markdown'));
			await fireEvent.press(screen.getByTestId('message-composer-code-block'));
			await fireEvent.press(screen.getByTestId('message-composer-send'));
		});
		expect(onSendMessage).toHaveBeenCalledTimes(1);
		expect(onSendMessage).toHaveBeenCalledWith('``````');
		expect(screen.toJSON()).toMatchSnapshot();
	});

	test('type test and tap code-block', async () => {
		const onSendMessage = jest.fn();
		render(<Render context={{ onSendMessage }} />);

		await act(async () => {
			await fireEvent.changeText(screen.getByTestId('message-composer-input'), 'test');
			await fireEvent(screen.getByTestId('message-composer-input'), 'focus');
			await fireEvent(screen.getByTestId('message-composer-input'), 'selectionChange', {
				nativeEvent: { selection: { start: 0, end: 4 } }
			});
			await fireEvent.press(screen.getByTestId('message-composer-open-markdown'));
			await fireEvent.press(screen.getByTestId('message-composer-code-block'));
			await fireEvent.press(screen.getByTestId('message-composer-send'));
		});
		expect(onSendMessage).toHaveBeenCalledTimes(1);
		expect(onSendMessage).toHaveBeenCalledWith('```test```');
		expect(screen.toJSON()).toMatchSnapshot();
	});
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
	const id = 'messageId';
	beforeEach(() => {
		render(
			<Provider store={mockedStore}>
				<RoomContext.Provider
					value={{
						...initialContext,
						rid: 'rid',
						selectedMessages: [id],
						action: 'edit',
						onSendMessage,
						editCancel,
						editRequest
					}}
				>
					<MessageComposerContainer />
				</RoomContext.Provider>
			</Provider>
		);
	});
	test('init', async () => {
		await screen.findByTestId('message-composer');
		expect(screen.getByTestId('message-composer')).toHaveStyle({ backgroundColor: colors.light.statusBackgroundWarning2 });
		expect(screen.getByTestId('message-composer-actions')).toBeOnTheScreen();
		expect(screen.queryByTestId('message-composer-send-audio')).toBeNull();
		expect(screen.getByTestId('message-composer-cancel-edit')).toBeOnTheScreen();
	});
	test('cancel', async () => {
		await screen.findByTestId('message-composer');
		expect(screen.getByTestId('message-composer')).toHaveStyle({ backgroundColor: colors.light.statusBackgroundWarning2 });
		fireEvent.press(screen.getByTestId('message-composer-cancel-edit'));
		expect(editCancel).toHaveBeenCalledTimes(1);
	});
	test('send', async () => {
		await screen.findByTestId('message-composer');
		expect(screen.getByTestId('message-composer')).toHaveStyle({ backgroundColor: colors.light.statusBackgroundWarning2 });
		fireEvent.press(screen.getByTestId('message-composer-send'));
		expect(editRequest).toHaveBeenCalledTimes(1);
		expect(editRequest).toHaveBeenCalledWith({ id, msg: `Message ${id}`, rid: 'rid' });
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
				<RoomContext.Provider value={{ ...initialContext, selectedMessages: [], onRemoveQuoteMessage }}>
					<MessageComposerContainer />
				</RoomContext.Provider>
			</Provider>
		);
		expect(screen.queryByTestId('composer-quote-abc')).toBeNull();
		expect(screen.queryByTestId('composer-quote-def')).toBeNull();
		expect(screen.toJSON()).toMatchSnapshot();

		// Add a quote
		rerender(
			<Provider store={mockedStore}>
				<Provider store={mockedStore}>
					<RoomContext.Provider value={{ ...initialContext, action: 'quote', selectedMessages: ['abc'], onRemoveQuoteMessage }}>
						<MessageComposerContainer />
					</RoomContext.Provider>
				</Provider>
			</Provider>
		);
		expect(screen.getByTestId('composer-quote-abc')).toBeOnTheScreen();
		expect(screen.queryByTestId('composer-quote-def')).toBeNull();
		expect(screen.toJSON()).toMatchSnapshot();

		// Add another quote
		rerender(
			<Provider store={mockedStore}>
				<Provider store={mockedStore}>
					<RoomContext.Provider
						value={{ ...initialContext, action: 'quote', selectedMessages: ['abc', 'def'], onRemoveQuoteMessage }}
					>
						<MessageComposerContainer />
					</RoomContext.Provider>
				</Provider>
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
