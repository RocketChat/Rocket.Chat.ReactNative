import { useEffect, type ReactElement, type RefObject } from 'react';
import { act, render, screen, fireEvent, waitFor, userEvent } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import { MessageComposerContainer } from './MessageComposerContainer';
import { ComposerAttachments } from './components/Attachments/ComposerAttachments';
import { setPermissions } from '../../actions/permissions';
import { addSettings } from '../../actions/settings';
import { selectServerRequest } from '../../actions/server';
import { setUser } from '../../actions/login';
import { mockedStore } from '../../reducers/mockedStore';
import { type IPermissionsState } from '../../reducers/permissions';
import { type IMessage, type IShareAttachment, type TMessageActionState } from '../../definitions';
import { colors } from '../../lib/constants/colors';
import { type ComposerState } from './ComposerStore';
import { ComposerProvider } from './ComposerStore';
import { MessageActionProvider } from '../message/stores/MessageActionStore';
import * as EmojiKeyboardHook from './hooks/useEmojiKeyboard';
import { initStore } from '../../lib/store/auxStore';
import { searchRemote } from '../../lib/methods/search';
import database from '../../lib/database';
import { useMessageComposerApi } from './context';
import { type IMessageComposerRef } from './interfaces';
import { sendFileMessage } from '../../lib/methods/sendFileMessage';
import { runSlashCommand } from '../../lib/services/restApi';
import { useChooseMedia } from './hooks/useChooseMedia';
import { useMessageActionStoreApi } from '../message/stores/MessageActionStore';
import { useAltTextSupported } from '../../lib/hooks/useAltTextSupported';

jest.mock('expo-document-picker', () => ({
	getDocumentAsync: jest.fn()
}));

jest.mock('../../lib/methods/helpers/ImagePicker/ImagePicker', () => ({
	__esModule: true,
	default: {
		openCamera: jest.fn(),
		openPicker: jest.fn()
	}
}));

jest.mock('../../lib/database/services/Subscription', () => ({
	getSubscriptionByRoomId: jest.fn()
}));

jest.mock('../../lib/database/services/Thread', () => ({
	getThreadById: jest.fn()
}));

jest.mock('../../lib/navigation/appNavigation', () => ({
	navigate: jest.fn()
}));

jest.mock('../../lib/hooks/useAltTextSupported', () => ({
	useAltTextSupported: jest.fn()
}));

jest.useFakeTimers();

// Ensure search returns at least one item so autocomplete renders
jest.mock('../../lib/methods/search', () => ({
	searchLocal: jest.fn(() => []),
	searchRemote: jest.fn(() => [{ _id: 'u1', username: 'john', name: 'John' }])
}));

jest.mock('../../lib/services/restApi', () => ({
	getListCannedResponse: jest.fn(() => ({
		success: true,
		cannedResponses: [{ _id: '1', shortcut: 'brb', text: 'Be right back' }]
	})),
	runSlashCommand: jest.fn(() => Promise.resolve())
}));

jest.mock('../../lib/methods/sendFileMessage', () => ({
	sendFileMessage: jest.fn(() => Promise.resolve())
}));

const user = userEvent.setup();

const advanceComposerTimers = async (time = 500) => {
	await act(() => {
		jest.advanceTimersByTime(time);
	});
};

const renderAndFlush = async (ui: ReactElement) => {
	render(ui);
	await act(async () => {
		await Promise.resolve();
	});
};

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
	initStore(mockedStore);
};
initialStoreState();

jest.mock('../../lib/database/services/Message', () => ({
	getMessageById: (messageId: any) => ({
		id: messageId,
		rid: 'rid',
		msg: messageId !== 'image' ? `Message ${messageId}` : undefined,
		attachments:
			messageId === 'image'
				? [
						{
							description: `Attachment description for ${messageId}`
						}
					]
				: []
	})
}));

const initialContext = {
	rid: 'rid',
	tmid: undefined,
	room: {
		rid: 'rid',
		t: 'd',
		tmid: undefined,
		name: 'Rocket Chat',
		fname: 'Rocket Chat',
		usernames: ['user1', 'user2'],
		prid: undefined,
		federated: false
	},
	sharing: false,
	editCancel: jest.fn(),
	editRequest: jest.fn(),
	onSendMessage: jest.fn(),
	onRemoveQuoteMessage: jest.fn()
};

const Render = ({
	context,
	action,
	children,
	forwardedRef
}: {
	context?: Partial<ComposerState>;
	action?: TMessageActionState;
	children?: ReactElement;
	forwardedRef?: RefObject<IMessageComposerRef | null>;
}) => (
	<Provider store={mockedStore}>
		<MessageActionProvider initialAction={action}>
			<ComposerProvider {...initialContext} {...context}>
				<MessageComposerContainer ref={forwardedRef}>
					<>
						<ComposerAttachments />
						{children}
					</>
				</MessageComposerContainer>
			</ComposerProvider>
		</MessageActionProvider>
	</Provider>
);

type MediaTransferProbe = ReturnType<typeof useChooseMedia>;
let mediaTransferProbe: MediaTransferProbe;
let mediaActionStore: ReturnType<typeof useMessageActionStoreApi>;
const mediaTransferProbes: Record<string, MediaTransferProbe> = {};
const mediaActionStores: Record<string, ReturnType<typeof useMessageActionStoreApi>> = {};

const MediaTransferProbe = ({
	name = 'default',
	rid = 'rid',
	tmid = 'thread-id'
}: {
	name?: string;
	rid?: string;
	tmid?: string;
}) => {
	const probe = useChooseMedia({ rid, tmid, permissionToUpload: true });
	mediaTransferProbe = probe;
	mediaTransferProbes[name] = probe;
	mediaActionStore = useMessageActionStoreApi();
	mediaActionStores[name] = mediaActionStore;
	return null;
};

const AttachmentSeeder = ({ attachments }: { attachments: IShareAttachment[] }) => {
	const { addAttachments } = useMessageComposerApi();

	useEffect(() => {
		addAttachments(attachments);
	}, [addAttachments, attachments]);

	return null;
};

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

let showEmojiKeyboard = false;
let showEmojiSearchbar = false;

beforeEach(() => {
	showEmojiKeyboard = false;
	showEmojiSearchbar = false;
	(runSlashCommand as jest.Mock).mockClear();
	// Default DB mocks used by autocomplete
	(database.active.get as unknown as jest.Mock).mockImplementation(() => ({
		query: jest.fn(() => ({ fetch: jest.fn(() => Promise.resolve([])) }))
	}));
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
	mediaTransferProbe = undefined as unknown as MediaTransferProbe;
	mediaActionStore = undefined as unknown as ReturnType<typeof useMessageActionStoreApi>;
	Object.keys(mediaTransferProbes).forEach(key => delete mediaTransferProbes[key]);
	Object.keys(mediaActionStores).forEach(key => delete mediaActionStores[key]);
	(useAltTextSupported as jest.Mock).mockReturnValue(false);
	(require('expo-document-picker').getDocumentAsync as jest.Mock).mockReset();
	const imagePicker = require('../../lib/methods/helpers/ImagePicker/ImagePicker').default;
	imagePicker.openCamera.mockReset();
	imagePicker.openPicker.mockReset();
	require('../../lib/database/services/Subscription').getSubscriptionByRoomId.mockResolvedValue({
		rid: 'rid',
		t: 'c',
		roles: [],
		observe: () => ({ subscribe: () => ({ unsubscribe: jest.fn() }) })
	});
	require('../../lib/database/services/Thread').getThreadById.mockResolvedValue({ id: 'thread-id' });
	require('../../lib/navigation/appNavigation').navigate.mockClear();
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

			// expect(screen.getByTestId('message-composer-close-emoji')).toBeOnTheScreen();
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
				expect(onSendMessage).toHaveBeenCalledWith('**', false);
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
				expect(onSendMessage).toHaveBeenCalledWith('*test*', false);
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
				expect(onSendMessage).toHaveBeenCalledWith('__', false);
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
				expect(onSendMessage).toHaveBeenCalledWith('_test_', false);
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
				expect(onSendMessage).toHaveBeenCalledWith('~~', false);
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
				expect(onSendMessage).toHaveBeenCalledWith('~test~', false);
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
				expect(onSendMessage).toHaveBeenCalledWith('``', false);
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
				expect(onSendMessage).toHaveBeenCalledWith('`test`', false);
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
				expect(onSendMessage).toHaveBeenCalledWith('``````', false);
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
				expect(onSendMessage).toHaveBeenCalledWith('```test```', false);
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
			expect(onSendMessage).toHaveBeenCalledWith('@', false);
			expect(screen.toJSON()).toMatchSnapshot();
		});
	});

	describe('Autocomplete', () => {
		test('typing @ opens autocomplete', async () => {
			render(<Render />);

			await fireEvent(screen.getByTestId('message-composer-input'), 'focus');
			await fireEvent.changeText(screen.getByTestId('message-composer-input'), '@');
			await fireEvent(screen.getByTestId('message-composer-input'), 'selectionChange', {
				nativeEvent: { selection: { start: 1, end: 1 } }
			});

			await advanceComposerTimers();

			await waitFor(() => expect(screen.getByTestId('autocomplete')).toBeOnTheScreen());
		});

		test('select @ user inserts mention and sends, autocomplete hides', async () => {
			const onSendMessage = jest.fn();
			(searchRemote as unknown as jest.Mock).mockImplementationOnce(() => [{ _id: 'u1', username: 'john', name: 'John' }]);
			render(<Render context={{ onSendMessage }} />);

			await fireEvent(screen.getByTestId('message-composer-input'), 'focus');
			await fireEvent.changeText(screen.getByTestId('message-composer-input'), '@');
			await fireEvent(screen.getByTestId('message-composer-input'), 'selectionChange', {
				nativeEvent: { selection: { start: 1, end: 1 } }
			});
			await advanceComposerTimers();
			await waitFor(() => expect(screen.getByTestId('autocomplete-item-John')).toBeOnTheScreen());

			await user.press(screen.getByTestId('autocomplete-item-John'));
			await waitFor(() => expect(screen.queryByTestId('autocomplete')).not.toBeOnTheScreen());

			await user.press(screen.getByTestId('message-composer-send'));
			expect(onSendMessage).toHaveBeenCalledTimes(1);
			expect(onSendMessage).toHaveBeenCalledWith('@john', false);
		});

		test('does not show @all or @here in autocomplete when user does not have permissions', async () => {
			mockedStore.dispatch(setPermissions({ 'mention-all': [], 'mention-here': [] }));
			const onSendMessage = jest.fn();
			render(<Render context={{ onSendMessage }} />);

			await fireEvent(screen.getByTestId('message-composer-input'), 'focus');
			await fireEvent.changeText(screen.getByTestId('message-composer-input'), '@');
			await fireEvent(screen.getByTestId('message-composer-input'), 'selectionChange', {
				nativeEvent: { selection: { start: 1, end: 1 } }
			});
			await advanceComposerTimers();

			await waitFor(() => expect(screen.queryByTestId('autocomplete-item-all')).not.toBeOnTheScreen());
			await waitFor(() => expect(screen.queryByTestId('autocomplete-item-here')).not.toBeOnTheScreen());
		});

		test('shows only @all when user has mention-all permission', async () => {
			mockedStore.dispatch(setPermissions({ 'mention-all': ['user'], 'mention-here': [] }));
			const onSendMessage = jest.fn();
			render(<Render context={{ onSendMessage }} />);

			await fireEvent(screen.getByTestId('message-composer-input'), 'focus');
			await fireEvent.changeText(screen.getByTestId('message-composer-input'), '@');
			await fireEvent(screen.getByTestId('message-composer-input'), 'selectionChange', {
				nativeEvent: { selection: { start: 1, end: 1 } }
			});
			await advanceComposerTimers();

			await waitFor(() => expect(screen.queryByTestId('autocomplete-item-all')).toBeOnTheScreen());
			await waitFor(() => expect(screen.queryByTestId('autocomplete-item-here')).not.toBeOnTheScreen());
		});

		test('shows only @here when user has mention-here permission', async () => {
			mockedStore.dispatch(setPermissions({ 'mention-here': ['user'], 'mention-all': [] }));
			const onSendMessage = jest.fn();
			render(<Render context={{ onSendMessage }} />);

			await fireEvent(screen.getByTestId('message-composer-input'), 'focus');
			await fireEvent.changeText(screen.getByTestId('message-composer-input'), '@');
			await fireEvent(screen.getByTestId('message-composer-input'), 'selectionChange', {
				nativeEvent: { selection: { start: 1, end: 1 } }
			});
			await advanceComposerTimers();

			await waitFor(() => expect(screen.queryByTestId('autocomplete-item-here')).toBeOnTheScreen());
			await waitFor(() => expect(screen.queryByTestId('autocomplete-item-all')).not.toBeOnTheScreen());
		});

		test('shows both @all and @here when user has both permissions', async () => {
			mockedStore.dispatch(setPermissions({ 'mention-all': ['user'], 'mention-here': ['user'] }));
			const onSendMessage = jest.fn();
			render(<Render context={{ onSendMessage }} />);

			await fireEvent(screen.getByTestId('message-composer-input'), 'focus');
			await fireEvent.changeText(screen.getByTestId('message-composer-input'), '@');
			await fireEvent(screen.getByTestId('message-composer-input'), 'selectionChange', {
				nativeEvent: { selection: { start: 1, end: 1 } }
			});
			await advanceComposerTimers();

			await waitFor(() => expect(screen.queryByTestId('autocomplete-item-all')).toBeOnTheScreen());
			await waitFor(() => expect(screen.queryByTestId('autocomplete-item-here')).toBeOnTheScreen());
		});

		test('select # room inserts channel and sends, autocomplete hides', async () => {
			const onSendMessage = jest.fn();
			(searchRemote as unknown as jest.Mock).mockImplementationOnce(() => [{ rid: 'r1', name: 'general', t: 'c' }]);
			render(<Render context={{ onSendMessage }} />);

			await fireEvent(screen.getByTestId('message-composer-input'), 'focus');
			await fireEvent.changeText(screen.getByTestId('message-composer-input'), '#');
			await fireEvent(screen.getByTestId('message-composer-input'), 'selectionChange', {
				nativeEvent: { selection: { start: 1, end: 1 } }
			});
			await advanceComposerTimers();
			await waitFor(() => expect(screen.getByTestId('autocomplete-item-general')).toBeOnTheScreen());

			await user.press(screen.getByTestId('autocomplete-item-general'));
			await waitFor(() => expect(screen.queryByTestId('autocomplete')).not.toBeOnTheScreen());

			await user.press(screen.getByTestId('message-composer-send'));
			expect(onSendMessage).toHaveBeenCalledTimes(1);
			expect(onSendMessage).toHaveBeenCalledWith('#general', false);
		});

		test('select : emoji inserts emoji and sends, autocomplete hides', async () => {
			const onSendMessage = jest.fn();
			render(<Render context={{ onSendMessage }} />);

			await fireEvent(screen.getByTestId('message-composer-input'), 'focus');
			await fireEvent.changeText(screen.getByTestId('message-composer-input'), ':smi');
			await fireEvent(screen.getByTestId('message-composer-input'), 'selectionChange', {
				nativeEvent: { selection: { start: 4, end: 4 } }
			});
			await advanceComposerTimers();
			await waitFor(() => expect(screen.getByTestId('autocomplete-item-smile')).toBeOnTheScreen());

			await user.press(screen.getByTestId('autocomplete-item-smile'));
			await waitFor(() => expect(screen.queryByTestId('autocomplete')).not.toBeOnTheScreen());

			await user.press(screen.getByTestId('message-composer-send'));
			expect(onSendMessage).toHaveBeenCalledTimes(1);
			expect(onSendMessage).toHaveBeenCalledWith(':smile:', false);
		});

		test('select / command inserts command text and sends, autocomplete hides', async () => {
			const onSendMessage = jest.fn();
			const getSpy = jest.spyOn(database.active as any, 'get');
			(getSpy as any).mockImplementation((table: string) => {
				if (table === 'slash_commands') {
					return {
						query: jest.fn(() => ({
							fetch: jest.fn(() => Promise.resolve([{ id: 'hello', description: 'desc', appId: 'app-id' }]))
						}))
					};
				}
				return { query: jest.fn(() => ({ fetch: jest.fn(() => Promise.resolve([])) })) };
			});
			render(<Render context={{ onSendMessage }} />);

			await fireEvent(screen.getByTestId('message-composer-input'), 'focus');
			await fireEvent.changeText(screen.getByTestId('message-composer-input'), '/hello');
			await fireEvent(screen.getByTestId('message-composer-input'), 'selectionChange', {
				nativeEvent: { selection: { start: 6, end: 6 } }
			});
			await advanceComposerTimers();
			await screen.findByTestId('autocomplete');
			await user.press(screen.getByTestId('message-composer-send'));
			await waitFor(() => expect(screen.queryByTestId('autocomplete')).not.toBeOnTheScreen());
			expect(runSlashCommand).toHaveBeenCalledWith('hello', 'rid', '', expect.any(String), undefined);
			expect(onSendMessage).not.toHaveBeenCalled();
		});

		test('select ! canned response inserts text and sends, autocomplete hides', async () => {
			const onSendMessage = jest.fn();
			render(<Render context={{ onSendMessage, room: { ...initialContext.room, t: 'l' } }} />);

			await fireEvent(screen.getByTestId('message-composer-input'), 'focus');
			await fireEvent.changeText(screen.getByTestId('message-composer-input'), '!');
			await fireEvent(screen.getByTestId('message-composer-input'), 'selectionChange', {
				nativeEvent: { selection: { start: 1, end: 1 } }
			});
			await advanceComposerTimers();
			await waitFor(() => expect(screen.getByTestId('autocomplete-item-brb')).toBeOnTheScreen());

			await user.press(screen.getByTestId('autocomplete-item-brb'));
			await waitFor(() => expect(screen.queryByTestId('autocomplete')).not.toBeOnTheScreen());

			await user.press(screen.getByTestId('message-composer-send'));
			expect(onSendMessage).toHaveBeenCalledTimes(1);
			expect(onSendMessage).toHaveBeenCalledWith('Be right back', false);
		});
	});

	describe('edit message', () => {
		const onSendMessage = jest.fn();
		const editCancel = jest.fn();
		const editRequest = jest.fn();
		const id = 'messageId';
		beforeEach(() => {
			return renderAndFlush(
				<Render context={{ rid: 'rid', onSendMessage, editCancel, editRequest }} action={{ kind: 'edit', messageId: id }} />
			);
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

	describe('edit image description', () => {
		const editRequest = jest.fn();
		const id = 'image';
		test('edit image', async () => {
			await renderAndFlush(<Render context={{ rid: 'rid', editRequest }} action={{ kind: 'edit', messageId: id }} />);
			await screen.findByTestId('message-composer');
			await user.press(screen.getByTestId('message-composer-send'));
			expect(editRequest).toHaveBeenCalledWith({ id, msg: `Attachment description for ${id}`, rid: 'rid' });
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
			render(<Render action={{ kind: 'quote', messageIds: ['abc'] }} />);
			await screen.findByTestId('composer-quote-abc');
			expect(screen.queryByTestId('composer-quote-abc')).toBeOnTheScreen();
			expect(screen.toJSON()).toMatchSnapshot();
		});

		test('Add quote `def`', async () => {
			render(<Render action={{ kind: 'quote', messageIds: ['abc', 'def'] }} />);
			await screen.findByTestId('composer-quote-abc');
			expect(screen.queryByTestId('composer-quote-abc')).toBeOnTheScreen();
			expect(screen.queryByTestId('composer-quote-def')).toBeOnTheScreen();
			expect(screen.toJSON()).toMatchSnapshot();
		});

		test('Remove a quote', async () => {
			const onRemoveQuoteMessage = jest.fn();
			render(<Render context={{ onRemoveQuoteMessage }} action={{ kind: 'quote', messageIds: ['abc', 'def'] }} />);
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

	describe('Attachments', () => {
		const attachment = {
			filename: 'IMG_2444.png',
			size: 1234,
			mime: 'image/png',
			path: 'file:///tmp/IMG_2444.png',
			canUpload: true
		} as IShareAttachment;

		beforeEach(() => {
			(sendFileMessage as jest.Mock).mockClear();
		});

		test('shows inline attachments and remove button', async () => {
			render(
				<Render>
					<AttachmentSeeder attachments={[attachment]} />
				</Render>
			);

			await screen.findByTestId('message-composer-attachments');
			expect(screen.getByTestId('message-composer-attachment-0')).toBeOnTheScreen();
			expect(screen.getByTestId('message-composer-send')).toBeOnTheScreen();
			expect(screen.queryByTestId('message-composer-send-audio')).not.toBeOnTheScreen();

			await user.press(screen.getByTestId('message-composer-remove-attachment-0'));

			await waitFor(() => expect(screen.queryByTestId('message-composer-attachments')).not.toBeOnTheScreen());
			expect(screen.getByTestId('message-composer-send-audio')).toBeOnTheScreen();
		});

		test('sends composer attachments from the room instead of delegating to onSendMessage', async () => {
			const onSendMessage = jest.fn();
			render(
				<Render context={{ onSendMessage }}>
					<AttachmentSeeder attachments={[attachment]} />
				</Render>
			);

			await screen.findByTestId('message-composer-attachment-0');
			await fireEvent.changeText(screen.getByTestId('message-composer-input'), 'caption');
			await user.press(screen.getByTestId('message-composer-send'));

			await waitFor(() =>
				expect(sendFileMessage).toHaveBeenCalledWith(
					'rid',
					expect.objectContaining({
						name: 'IMG_2444.png',
						path: 'file:///tmp/IMG_2444.png',
						msg: 'caption',
						type: 'image/png'
					}),
					undefined,
					'https://open.rocket.chat',
					expect.objectContaining({ id: 'abc' })
				)
			);
			expect(onSendMessage).not.toHaveBeenCalled();
			expect(screen.queryByTestId('message-composer-attachments')).not.toBeOnTheScreen();
		});

		test('clears input after a delayed successful upload, including text typed while uploading', async () => {
			let resolveUpload!: () => void;
			const composerRef = { current: null } as RefObject<IMessageComposerRef | null>;
			(sendFileMessage as jest.Mock).mockImplementationOnce(() => new Promise<void>(resolve => (resolveUpload = resolve)));
			render(
				<Render forwardedRef={composerRef} action={{ kind: 'quote', messageIds: ['abc'] }}>
					<AttachmentSeeder attachments={[attachment]} />
				</Render>
			);
			await screen.findByTestId('message-composer-attachment-0');
			await screen.findByTestId('composer-quote-abc');
			await fireEvent.changeText(screen.getByTestId('message-composer-input'), 'caption');
			const sendPromise = user.press(screen.getByTestId('message-composer-send'));
			await waitFor(() => expect(sendFileMessage).toHaveBeenCalled());
			await fireEvent.changeText(screen.getByTestId('message-composer-input'), 'typed while uploading');
			resolveUpload();
			await sendPromise;

			await waitFor(() => expect(composerRef.current?.getText()).toBe(''));
			expect(screen.queryByTestId('composer-quote-abc')).not.toBeOnTheScreen();
			expect(screen.queryByTestId('message-composer-attachments')).not.toBeOnTheScreen();
		});

		test('restores input and keeps attachments after a failed upload', async () => {
			(sendFileMessage as jest.Mock).mockRejectedValueOnce(new Error('upload failed'));
			const composerRef = { current: null } as RefObject<IMessageComposerRef | null>;
			render(
				<Render forwardedRef={composerRef} action={{ kind: 'quote', messageIds: ['abc'] }}>
					<AttachmentSeeder attachments={[attachment]} />
				</Render>
			);
			await screen.findByTestId('message-composer-attachment-0');
			await fireEvent.changeText(screen.getByTestId('message-composer-input'), 'caption');
			await user.press(screen.getByTestId('message-composer-send'));

			await waitFor(() => expect(composerRef.current?.getText()).toBe('caption'));
			expect(screen.getByTestId('message-composer-attachments')).toBeOnTheScreen();
			expect(screen.getByTestId('composer-quote-abc')).toBeOnTheScreen();
		});
	});

	describe('media transfer ownership', () => {
		const attachment = { filename: 'legacy.pdf', size: 12, mime: 'application/pdf', path: 'file:///tmp/legacy.pdf' };

		test('legacy transfer reads current text while retaining Quote IDs captured by the initiating render', async () => {
			let resolveDocument!: (result: unknown) => void;
			(require('expo-document-picker').getDocumentAsync as jest.Mock).mockReturnValueOnce(
				new Promise(resolve => (resolveDocument = resolve))
			);
			const ref = { current: null } as RefObject<IMessageComposerRef | null>;
			render(
				<Render forwardedRef={ref} action={{ kind: 'quote', messageIds: ['old-quote'] }}>
					<MediaTransferProbe />
				</Render>
			);
			await waitFor(() => expect(mediaTransferProbe).toBeDefined());

			const choosePromise = mediaTransferProbe.chooseFile();
			ref.current?.setInput('awaiting text');
			mediaActionStore.getState().actions.startReacting('react-now');
			resolveDocument({
				canceled: false,
				assets: [{ name: attachment.filename, size: attachment.size, mimeType: attachment.mime, uri: attachment.path }]
			});
			await choosePromise;
			ref.current?.setInput('current text');
			mediaActionStore.getState().actions.startReacting('react-after-resolution');

			const navigate = require('../../lib/navigation/appNavigation').navigate as jest.Mock;
			const params = navigate.mock.calls[0][1];
			expect(params.startShareView()).toEqual({ text: 'current text', selectedMessages: ['old-quote'] });
			params.finishShareView('', []);
			expect(ref.current?.getText()).toBe('');
			expect(mediaActionStore.getState().action).toBeNull();
		});

		test.each(['chooseFile', 'takePhoto', 'chooseFromLibrary'] as const)(
			'%s cancellation leaves input and Quotes unchanged',
			async method => {
				const ref = { current: null } as RefObject<IMessageComposerRef | null>;
				render(
					<Render forwardedRef={ref} action={{ kind: 'quote', messageIds: ['kept-quote'] }}>
						<MediaTransferProbe />
					</Render>
				);
				await waitFor(() => expect(mediaTransferProbe).toBeDefined());
				ref.current?.setInput('kept text');
				if (method === 'chooseFile') {
					(require('expo-document-picker').getDocumentAsync as jest.Mock).mockResolvedValueOnce({ canceled: true });
				} else {
					const imagePicker = require('../../lib/methods/helpers/ImagePicker/ImagePicker').default;
					imagePicker[method === 'takePhoto' ? 'openCamera' : 'openPicker'].mockRejectedValueOnce(new Error('cancelled'));
				}

				await mediaTransferProbe[method]();
				expect(require('../../lib/navigation/appNavigation').navigate).not.toHaveBeenCalled();
				expect(ref.current?.getText()).toBe('kept text');
				expect(mediaActionStore.getState().action).toEqual({ kind: 'quote', messageIds: ['kept-quote'] });
			}
		);

		test('same-rid Room and Thread composers transfer and restore independently', async () => {
			const roomRef = { current: null } as RefObject<IMessageComposerRef | null>;
			const threadRef = { current: null } as RefObject<IMessageComposerRef | null>;
			const Dual = () => (
				<Provider store={mockedStore}>
					<MessageActionProvider initialAction={{ kind: 'quote', messageIds: ['room-quote'] }}>
						<ComposerProvider {...initialContext} tmid={undefined}>
							<MessageComposerContainer ref={roomRef}>
								<MediaTransferProbe name='room' rid='same-rid' tmid='' />
							</MessageComposerContainer>
						</ComposerProvider>
					</MessageActionProvider>
					<MessageActionProvider initialAction={{ kind: 'quote', messageIds: ['thread-quote'] }}>
						<ComposerProvider {...initialContext} tmid='thread-id'>
							<MessageComposerContainer ref={threadRef}>
								<MediaTransferProbe name='thread' rid='same-rid' tmid='thread-id' />
							</MessageComposerContainer>
						</ComposerProvider>
					</MessageActionProvider>
				</Provider>
			);
			(require('expo-document-picker').getDocumentAsync as jest.Mock).mockResolvedValue({
				canceled: false,
				assets: [{ name: 'x.pdf', size: 1, mimeType: 'application/pdf', uri: 'file:///x.pdf' }]
			});
			render(<Dual />);
			await waitFor(() => expect(mediaTransferProbes.room).toBeDefined());
			roomRef.current?.setInput('room text');
			threadRef.current?.setInput('thread text');
			await Promise.all([mediaTransferProbes.room.chooseFile(), mediaTransferProbes.thread.chooseFile()]);

			const navigate = require('../../lib/navigation/appNavigation').navigate as jest.Mock;
			expect(navigate).toHaveBeenCalledTimes(2);
			const roomParams = navigate.mock.calls.find(([, params]) => params.thread === '')[1];
			const threadParams = navigate.mock.calls.find(([, params]) => params.thread?.id === 'thread-id')[1];
			expect(roomParams.startShareView().text).toBe('room text');
			expect(threadParams.startShareView().text).toBe('thread text');
			roomParams.finishShareView('room restored', ['room-restored']);
			threadParams.finishShareView('thread restored', ['thread-restored']);
			expect(roomRef.current?.getText()).toBe('room restored');
			expect(threadRef.current?.getText()).toBe('thread restored');
			expect(mediaActionStores.room.getState().action).toEqual({ kind: 'quote', messageIds: ['room-restored'] });
			expect(mediaActionStores.thread.getState().action).toEqual({ kind: 'quote', messageIds: ['thread-restored'] });
		});

		test('alt-text capable workspaces keep selected media inline', async () => {
			(useAltTextSupported as jest.Mock).mockReturnValue(true);
			(require('expo-document-picker').getDocumentAsync as jest.Mock).mockResolvedValueOnce({
				canceled: false,
				assets: [{ name: 'inline.pdf', size: 1, mimeType: 'application/pdf', uri: 'file:///inline.pdf' }]
			});
			render(
				<Render>
					<MediaTransferProbe />
				</Render>
			);
			await waitFor(() => expect(mediaTransferProbe).toBeDefined());
			await mediaTransferProbe.chooseFile();
			await waitFor(() => expect(screen.getByTestId('message-composer-attachments')).toBeOnTheScreen());
			expect(require('../../lib/navigation/appNavigation').navigate).not.toHaveBeenCalled();
		});
	});
});
