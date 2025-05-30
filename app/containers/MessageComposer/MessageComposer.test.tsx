import React from 'react';
import { render, screen, fireEvent, waitFor, userEvent } from '@testing-library/react-native';
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
import * as EmojiKeyboardHook from './hooks/useEmojiKeyboard';

jest.useFakeTimers();

const user = userEvent.setup();

const initialStoreState = () => {
	const baseUrl = 'https://open.rocket.chat';
	mockedStore.dispatch(selectServerRequest(baseUrl, '6.4.0'));
	mockedStore.dispatch(
		setUser({
			id: 'abc',
			username: 'rocket.cat',
			name: 'Rocket Cat',
			roles: ['user'],
			settings: {
				preferences: {
					convertAsciiEmoji: true
				}
			}
		})
	);

	const permissions: IPermissionsState = { 'mobile-upload-file': ['user'] };
	mockedStore.dispatch(setPermissions(permissions));
	mockedStore.dispatch(addSettings({ Message_AudioRecorderEnabled: true }));
};
initialStoreState();

const initialContext = {
	rid: 'rid',
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

const sharedValue = {
	value: false,
	get: () => sharedValue.value,
	set: (v: boolean) => {
		sharedValue.value = v;
	},
	addListener: jest.fn(),
	removeListener: jest.fn(),
	modify: jest.fn()
};

const sharedValueSearchbar = {
	value: false,
	get: () => sharedValueSearchbar.value,
	set: (v: boolean) => {
		sharedValueSearchbar.value = v;
	},
	addListener: jest.fn(),
	removeListener: jest.fn(),
	modify: jest.fn()
};

const keyboardHeightSharedValue = {
	value: 0,
	get: () => keyboardHeightSharedValue.value,
	set: (v: number) => {
		keyboardHeightSharedValue.value = v;
	},
	addListener: jest.fn(),
	removeListener: jest.fn(),
	modify: jest.fn()
};

// Mock KeyboardController
jest.mock('react-native-keyboard-controller', () => ({
	KeyboardController: {
		dismiss: jest.fn(() => Promise.resolve())
	}
}));

let showEmojiKeyboard = false;
let showEmojiSearchbar = false;

beforeEach(() => {
	showEmojiKeyboard = false;
	showEmojiSearchbar = false;
	jest.spyOn(EmojiKeyboardHook, 'useEmojiKeyboard').mockReturnValue({
		showEmojiPickerSharedValue: sharedValue,
		showEmojiKeyboard,
		openEmojiKeyboard: jest.fn(),
		closeEmojiKeyboard: jest.fn(),
		showEmojiSearchbarSharedValue: sharedValueSearchbar,
		showEmojiSearchbar,
		openEmojiSearchbar: jest.fn(),
		closeEmojiSearchbar: jest.fn(),
		resetKeyboard: jest.fn(),
		keyboardHeight: keyboardHeightSharedValue
	});
	sharedValue.value = false; // reset before each test
	sharedValueSearchbar.value = false;
	keyboardHeightSharedValue.value = 0;
});

describe('MessageComposer', () => {
	describe('Toolbar', () => {
		test('tap actions', async () => {
			render(<Render />);

			await fireEvent(screen.getByTestId('message-composer-input'), 'focus');
			await user.press(screen.getByTestId('message-composer-actions'));
			expect(screen.toJSON()).toMatchSnapshot();
		});

		test('tap emoji', async () => {
			const { rerender } = render(<Render />);

			await fireEvent(screen.getByTestId('message-composer-input'), 'focus');
			await user.press(screen.getByTestId('message-composer-open-emoji'));

			// Simulate the state change that would happen when emoji button is pressed
			sharedValue.value = true;
			showEmojiKeyboard = true;
			jest.spyOn(EmojiKeyboardHook, 'useEmojiKeyboard').mockReturnValue({
				showEmojiPickerSharedValue: sharedValue,
				showEmojiKeyboard,
				openEmojiKeyboard: jest.fn(),
				closeEmojiKeyboard: jest.fn(),
				showEmojiSearchbarSharedValue: sharedValueSearchbar,
				showEmojiSearchbar,
				openEmojiSearchbar: jest.fn(),
				closeEmojiSearchbar: jest.fn(),
				resetKeyboard: jest.fn(),
				keyboardHeight: keyboardHeightSharedValue
			});

			rerender(<Render />);

			expect(screen.getByTestId('message-composer-close-emoji')).toBeOnTheScreen();
			expect(screen.toJSON()).toMatchSnapshot();
		});

		describe('Markdown', () => {
			test('tap markdown', async () => {
				render(<Render />);

				await fireEvent(screen.getByTestId('message-composer-input'), 'focus');
				await waitFor(() => screen.getByTestId('message-composer-open-markdown'));
				await user.press(screen.getByTestId('message-composer-open-markdown'));
				await waitFor(() => screen.getByTestId('message-composer-close-markdown'));
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

				await fireEvent(screen.getByTestId('message-composer-input'), 'focus');
				await waitFor(() => screen.getByTestId('message-composer-open-markdown'));
				await user.press(screen.getByTestId('message-composer-open-markdown'));
				await waitFor(() => screen.getByTestId('message-composer-bold'));
				await user.press(screen.getByTestId('message-composer-bold'));
				await user.press(screen.getByTestId('message-composer-send'));
				expect(onSendMessage).toHaveBeenCalledTimes(1);
				expect(onSendMessage).toHaveBeenCalledWith('**', undefined);
				expect(screen.toJSON()).toMatchSnapshot();
			});

			test('type test and tap bold', async () => {
				const onSendMessage = jest.fn();
				render(<Render context={{ onSendMessage }} />);

				await fireEvent.changeText(screen.getByTestId('message-composer-input'), 'test');
				await fireEvent(screen.getByTestId('message-composer-input'), 'focus');
				await fireEvent(screen.getByTestId('message-composer-input'), 'selectionChange', {
					nativeEvent: { selection: { start: 0, end: 4 } }
				});
				await waitFor(() => screen.getByTestId('message-composer-open-markdown'));
				await user.press(screen.getByTestId('message-composer-open-markdown'));
				await waitFor(() => screen.getByTestId('message-composer-bold'));
				await user.press(screen.getByTestId('message-composer-bold'));
				await user.press(screen.getByTestId('message-composer-send'));
				expect(onSendMessage).toHaveBeenCalledTimes(1);
				expect(onSendMessage).toHaveBeenCalledWith('*test*', undefined);
				expect(screen.toJSON()).toMatchSnapshot();
			});

			test('tap italic', async () => {
				const onSendMessage = jest.fn();
				render(<Render context={{ onSendMessage }} />);

				await fireEvent(screen.getByTestId('message-composer-input'), 'focus');
				await waitFor(() => screen.getByTestId('message-composer-open-markdown'));
				await user.press(screen.getByTestId('message-composer-open-markdown'));
				await waitFor(() => screen.getByTestId('message-composer-italic'));
				await user.press(screen.getByTestId('message-composer-italic'));
				await user.press(screen.getByTestId('message-composer-send'));
				expect(onSendMessage).toHaveBeenCalledTimes(1);
				expect(onSendMessage).toHaveBeenCalledWith('__', undefined);
				expect(screen.toJSON()).toMatchSnapshot();
			});

			test('type test and tap italic', async () => {
				const onSendMessage = jest.fn();
				render(<Render context={{ onSendMessage }} />);

				await fireEvent.changeText(screen.getByTestId('message-composer-input'), 'test');
				await fireEvent(screen.getByTestId('message-composer-input'), 'focus');
				await fireEvent(screen.getByTestId('message-composer-input'), 'selectionChange', {
					nativeEvent: { selection: { start: 0, end: 4 } }
				});
				await waitFor(() => screen.getByTestId('message-composer-open-markdown'));
				await user.press(screen.getByTestId('message-composer-open-markdown'));
				await waitFor(() => screen.getByTestId('message-composer-italic'));
				await user.press(screen.getByTestId('message-composer-italic'));
				await user.press(screen.getByTestId('message-composer-send'));
				expect(onSendMessage).toHaveBeenCalledTimes(1);
				expect(onSendMessage).toHaveBeenCalledWith('_test_', undefined);
				expect(screen.toJSON()).toMatchSnapshot();
			});

			test('tap strike', async () => {
				const onSendMessage = jest.fn();
				render(<Render context={{ onSendMessage }} />);

				await fireEvent(screen.getByTestId('message-composer-input'), 'focus');
				await waitFor(() => screen.getByTestId('message-composer-open-markdown'));
				await user.press(screen.getByTestId('message-composer-open-markdown'));
				await waitFor(() => screen.getByTestId('message-composer-strike'));
				await user.press(screen.getByTestId('message-composer-strike'));
				await user.press(screen.getByTestId('message-composer-send'));
				expect(onSendMessage).toHaveBeenCalledTimes(1);
				expect(onSendMessage).toHaveBeenCalledWith('~~', undefined);
				expect(screen.toJSON()).toMatchSnapshot();
			});

			test('type test and tap strike', async () => {
				const onSendMessage = jest.fn();
				render(<Render context={{ onSendMessage }} />);

				await fireEvent.changeText(screen.getByTestId('message-composer-input'), 'test');
				await fireEvent(screen.getByTestId('message-composer-input'), 'focus');
				await fireEvent(screen.getByTestId('message-composer-input'), 'selectionChange', {
					nativeEvent: { selection: { start: 0, end: 4 } }
				});
				await waitFor(() => screen.getByTestId('message-composer-open-markdown'));
				await user.press(screen.getByTestId('message-composer-open-markdown'));
				await waitFor(() => screen.getByTestId('message-composer-strike'));
				await user.press(screen.getByTestId('message-composer-strike'));
				await user.press(screen.getByTestId('message-composer-send'));
				expect(onSendMessage).toHaveBeenCalledTimes(1);
				expect(onSendMessage).toHaveBeenCalledWith('~test~', undefined);
				expect(screen.toJSON()).toMatchSnapshot();
			});

			test('tap code', async () => {
				const onSendMessage = jest.fn();
				render(<Render context={{ onSendMessage }} />);

				await fireEvent(screen.getByTestId('message-composer-input'), 'focus');
				await waitFor(() => screen.getByTestId('message-composer-open-markdown'));
				await user.press(screen.getByTestId('message-composer-open-markdown'));
				await waitFor(() => screen.getByTestId('message-composer-code'));
				await user.press(screen.getByTestId('message-composer-code'));
				await user.press(screen.getByTestId('message-composer-send'));
				expect(onSendMessage).toHaveBeenCalledTimes(1);
				expect(onSendMessage).toHaveBeenCalledWith('``', undefined);
				expect(screen.toJSON()).toMatchSnapshot();
			});

			test('type test and tap code', async () => {
				const onSendMessage = jest.fn();
				render(<Render context={{ onSendMessage }} />);

				await fireEvent.changeText(screen.getByTestId('message-composer-input'), 'test');
				await fireEvent(screen.getByTestId('message-composer-input'), 'focus');
				await fireEvent(screen.getByTestId('message-composer-input'), 'selectionChange', {
					nativeEvent: { selection: { start: 0, end: 4 } }
				});
				await waitFor(() => screen.getByTestId('message-composer-open-markdown'));
				await user.press(screen.getByTestId('message-composer-open-markdown'));
				await waitFor(() => screen.getByTestId('message-composer-code'));
				await user.press(screen.getByTestId('message-composer-code'));
				await user.press(screen.getByTestId('message-composer-send'));
				expect(onSendMessage).toHaveBeenCalledTimes(1);
				expect(onSendMessage).toHaveBeenCalledWith('`test`', undefined);
				expect(screen.toJSON()).toMatchSnapshot();
			});

			test('tap code-block', async () => {
				const onSendMessage = jest.fn();
				render(<Render context={{ onSendMessage }} />);

				await fireEvent(screen.getByTestId('message-composer-input'), 'focus');
				await waitFor(() => screen.getByTestId('message-composer-open-markdown'));
				await user.press(screen.getByTestId('message-composer-open-markdown'));
				await waitFor(() => screen.getByTestId('message-composer-code-block'));
				await user.press(screen.getByTestId('message-composer-code-block'));
				await user.press(screen.getByTestId('message-composer-send'));
				expect(onSendMessage).toHaveBeenCalledTimes(1);
				expect(onSendMessage).toHaveBeenCalledWith('``````', undefined);
				expect(screen.toJSON()).toMatchSnapshot();
			});

			test('type test and tap code-block', async () => {
				const onSendMessage = jest.fn();
				render(<Render context={{ onSendMessage }} />);

				await fireEvent.changeText(screen.getByTestId('message-composer-input'), 'test');
				await fireEvent(screen.getByTestId('message-composer-input'), 'focus');
				await fireEvent(screen.getByTestId('message-composer-input'), 'selectionChange', {
					nativeEvent: { selection: { start: 0, end: 4 } }
				});
				await waitFor(() => screen.getByTestId('message-composer-open-markdown'));
				await user.press(screen.getByTestId('message-composer-open-markdown'));
				await waitFor(() => screen.getByTestId('message-composer-code-block'));
				await user.press(screen.getByTestId('message-composer-code-block'));
				await user.press(screen.getByTestId('message-composer-send'));
				expect(onSendMessage).toHaveBeenCalledTimes(1);
				expect(onSendMessage).toHaveBeenCalledWith('```test```', undefined);
				expect(screen.toJSON()).toMatchSnapshot();
			});
		});

		test('tap mention', async () => {
			const onSendMessage = jest.fn();
			render(<Render context={{ onSendMessage }} />);

			await fireEvent(screen.getByTestId('message-composer-input'), 'focus');
			await waitFor(() => screen.getByTestId('message-composer-mention'));
			await user.press(screen.getByTestId('message-composer-mention'));
			await user.press(screen.getByTestId('message-composer-send'));
			expect(onSendMessage).toHaveBeenCalledTimes(1);
			expect(onSendMessage).toHaveBeenCalledWith('@', undefined);
			expect(screen.toJSON()).toMatchSnapshot();
		});
	});

	describe('edit message', () => {
		const onSendMessage = jest.fn();
		const editCancel = jest.fn();
		const editRequest = jest.fn();
		const id = 'messageId';
		beforeEach(() => {
			render(<Render context={{ rid: 'rid', selectedMessages: [id], action: 'edit', onSendMessage, editCancel, editRequest }} />);
		});
		test('init', async () => {
			await screen.findByTestId('message-composer');
			expect(screen.getByTestId('message-composer')).toHaveStyle({ backgroundColor: colors.light.statusBackgroundWarning2 });
			expect(screen.getByTestId('message-composer-actions')).toBeOnTheScreen();
			expect(screen.queryByTestId('message-composer-send-audio')).not.toBeOnTheScreen();
			expect(screen.getByTestId('message-composer-cancel-edit')).toBeOnTheScreen();
		});
		test('cancel', async () => {
			await screen.findByTestId('message-composer');
			expect(screen.getByTestId('message-composer')).toHaveStyle({ backgroundColor: colors.light.statusBackgroundWarning2 });
			await user.press(screen.getByTestId('message-composer-cancel-edit'));
			expect(editCancel).toHaveBeenCalledTimes(1);
			expect(screen.getByTestId('message-composer-actions')).toBeOnTheScreen();
			expect(screen.queryByTestId('message-composer-send-audio')).not.toBeOnTheScreen();
			expect(screen.getByTestId('message-composer-cancel-edit')).toBeOnTheScreen();
		});
		test('send', async () => {
			await screen.findByTestId('message-composer');
			expect(screen.getByTestId('message-composer')).toHaveStyle({ backgroundColor: colors.light.statusBackgroundWarning2 });
			await user.press(screen.getByTestId('message-composer-send'));
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
		test('Add quote `abc`', async () => {
			render(<Render context={{ action: 'quote', selectedMessages: ['abc'] }} />);
			await screen.findByTestId('composer-quote-abc');
			expect(screen.queryByTestId('composer-quote-abc')).toBeOnTheScreen();
			expect(screen.toJSON()).toMatchSnapshot();
		});

		test('Add quote `def`', async () => {
			render(<Render context={{ action: 'quote', selectedMessages: ['abc', 'def'] }} />);
			await screen.findByTestId('composer-quote-abc');
			expect(screen.queryByTestId('composer-quote-abc')).toBeOnTheScreen();
			expect(screen.queryByTestId('composer-quote-def')).toBeOnTheScreen();
			expect(screen.toJSON()).toMatchSnapshot();
		});

		test('Remove a quote', async () => {
			const onRemoveQuoteMessage = jest.fn();
			render(<Render context={{ action: 'quote', selectedMessages: ['abc', 'def'], onRemoveQuoteMessage }} />);
			await screen.findByTestId('composer-quote-def');
			await user.press(screen.getByTestId('composer-quote-remove-def'));
			expect(onRemoveQuoteMessage).toHaveBeenCalledTimes(1);
			expect(onRemoveQuoteMessage).toHaveBeenCalledWith('def');
			expect(screen.toJSON()).toMatchSnapshot();
		});
	});

	describe('Audio', () => {
		test('tap record', async () => {
			render(<Render />);
			expect(screen.getByTestId('message-composer-send-audio')).toBeOnTheScreen();
			await user.press(screen.getByTestId('message-composer-send-audio'));
			expect(screen.toJSON()).toMatchSnapshot();
		});
	});
});
