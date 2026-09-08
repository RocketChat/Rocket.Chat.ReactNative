import { createRef, useEffect, type ReactElement } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import { initStore } from '../../lib/store/auxStore';
import { mockedStore } from '../../reducers/mockedStore';
import { appStart } from '../../actions/app';
import { RootEnum } from '../../definitions';
import { RoomProviders } from '../RoomView/components/RoomProviders';
import { MessageComposerContainer, type IMessageComposerRef } from '../../containers/MessageComposer';
import { createMessageActionStore } from '../../containers/message/stores/MessageActionStore';
import { useChooseMedia } from '../../containers/MessageComposer/hooks/useChooseMedia';

jest.mock('expo-document-picker', () => ({
	getDocumentAsync: jest.fn()
}));
jest.mock('../../lib/navigation/appNavigation', () => ({
	navigate: jest.fn()
}));
jest.mock('../../lib/database/services/Subscription', () => ({
	getSubscriptionByRoomId: jest.fn()
}));
jest.mock('../../lib/database/services/Thread', () => ({
	getThreadById: jest.fn()
}));
jest.mock('../../lib/hooks/useAltTextSupported', () => ({
	useAltTextSupported: jest.fn(() => false)
}));

jest.mock('../../lib/database', () => ({
	active: {
		get: jest.fn(() => ({
			query: jest.fn(() => ({
				fetch: jest.fn(() => Promise.resolve([])),
				observe: jest.fn(() => ({ subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })) }))
			}))
		})),
		write: jest.fn((callback: () => unknown) => callback())
	},
	servers: {
		get: jest.fn(() => ({
			find: jest.fn(() => Promise.resolve({}))
		}))
	}
}));

jest.mock('./Preview', () => () => null);
jest.mock('../../containers/Thumbs', () => () => null);
jest.mock('../../containers/ActionSheet', () => ({
	showActionSheetRef: jest.fn(),
	useActionSheet: () => ({ showActionSheet: jest.fn() })
}));
jest.mock('../../containers/MessageComposer/components/Attachments/AttachmentActionSheet', () => ({
	AttachmentActionSheet: () => null
}));
jest.mock('../../lib/methods/sendMessage', () => ({
	sendMessage: jest.fn()
}));

const { showActionSheetRef } = require('../../containers/ActionSheet');
const { AttachmentActionSheet } = require('../../containers/MessageComposer/components/Attachments/AttachmentActionSheet');
const { ShareView } = require('./index');
const mockGetSubscriptionByRoomId = require('../../lib/database/services/Subscription').getSubscriptionByRoomId as jest.Mock;

initStore(mockedStore);

const OriginMediaProbe = ({ onReady }: { onReady: (chooseFile: () => Promise<void>) => void }): ReactElement | null => {
	const { chooseFile } = useChooseMedia({ rid: 'room-id', tmid: undefined, permissionToUpload: true });
	useEffect(() => onReady(chooseFile), [chooseFile, onReady]);
	return null;
};

const makeInstance = ({
	mime,
	serverVersion,
	serverInfoVersion,
	isShareExtension = false
}: {
	mime: string;
	serverVersion?: string;
	serverInfoVersion?: string;
	isShareExtension?: boolean;
}) => {
	const shareView = new ShareView({
		navigation: {
			setOptions: jest.fn(),
			pop: jest.fn()
		} as any,
		route: {
			key: 'ShareView',
			name: 'ShareView',
			params: {
				action: null,
				isShareExtension
			}
		} as any,
		theme: 'light',
		user: {
			id: 'user-id',
			username: 'rocket.cat',
			token: 'token'
		},
		server: 'server-id',
		serverVersion,
		dispatch: jest.fn()
	} as any);
	(shareView as any).setState = (
		update: Record<string, unknown> | ((state: unknown) => Record<string, unknown>),
		callback?: () => void
	) => {
		const nextState = typeof update === 'function' ? update(shareView.state) : update;
		shareView.state = {
			...shareView.state,
			...nextState
		};
		callback?.();
	};
	(shareView as any).serverInfo = (shareView as any).serverInfo || {};

	shareView.state = {
		selected: {
			filename: 'image.jpg',
			path: '/tmp/image.jpg',
			size: 1,
			mime
		},
		loading: false,
		readOnly: false,
		attachments: [
			{
				filename: 'image.jpg',
				path: '/tmp/image.jpg',
				size: 1,
				mime
			}
		],
		text: '',
		room: { rid: 'room-id', t: 'c' } as any,
		thread: '',
		maxFileSize: undefined,
		mediaAllowList: undefined
	};

	if (serverInfoVersion) {
		(shareView as any).serverInfo = { version: serverInfoVersion };
		(shareView as any).isShareExtension = isShareExtension;
	}

	return shareView;
};

describe('ShareView', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockGetSubscriptionByRoomId.mockResolvedValue({
			rid: 'room-id',
			t: 'c',
			roles: [],
			update: jest.fn(),
			observe: () => ({ subscribe: () => ({ unsubscribe: jest.fn() }) })
		});
	});

	it('selectFile selects the attachment and opens the alt text action sheet', () => {
		const shareView = makeInstance({ mime: 'image/jpeg', serverVersion: '8.5.0' });
		const setInput = jest.fn();
		(shareView as any).messageComposerRef = { current: { getText: () => '', setInput } };

		const target = { filename: 'second.jpg', path: '/tmp/second.jpg', size: 1, mime: 'image/jpeg', description: 'caption' };
		shareView.state.attachments.push(target as any);

		shareView.selectFile(target as any);

		expect(shareView.state.selected).toBe(target);
		expect(setInput).toHaveBeenCalledWith('caption');
		expect(showActionSheetRef).toHaveBeenCalledTimes(1);
		const arg = (showActionSheetRef as jest.Mock).mock.calls[0][0];
		expect(arg.snaps).toEqual(['85%']);
		expect(arg.fullContainer).toBe(true);
		expect(arg.children.type).toBe(AttachmentActionSheet);
		expect(arg.children.props.attachment).toBe(target);
	});

	it('updateAttachment persists alt text onto the matching attachment', () => {
		const shareView = makeInstance({ mime: 'image/jpeg', serverVersion: '8.5.0' });

		shareView.updateAttachment('/tmp/image.jpg', { altText: 'a cat on a mat' });

		expect(shareView.state.attachments[0].altText).toBe('a cat on a mat');
	});

	it('send() passes caption as msg and altText as description on server >= 8.4.0', async () => {
		const shareView = makeInstance({
			mime: 'image/jpeg',
			serverVersion: '8.5.0',
			serverInfoVersion: '8.5.0',
			isShareExtension: true
		});
		shareView.state.attachments[0].description = 'my caption';
		shareView.state.attachments[0].altText = 'a cat on a mat';
		shareView.state.attachments[0].canUpload = true;
		shareView.state = {
			...shareView.state,
			selected: shareView.state.attachments[0]
		};

		// the composer ref isn't mounted here; don't let the caption flush clobber the fixture
		shareView.saveSelectedDescription = jest.fn() as any;

		const sendFileMessageMod = require('../../lib/methods/sendFileMessage');
		const spy = jest.spyOn(sendFileMessageMod, 'sendFileMessage').mockResolvedValue(undefined);

		await shareView.send();

		const fileArg = spy.mock.calls[0]?.[1] as { description?: string; msg?: string } | undefined;
		expect(fileArg?.description).toBe('a cat on a mat');
		expect(fileArg?.msg).toBe('my caption');

		spy.mockRestore();
	});

	it('send() builds msg from prepareQuoteMessage using the message action store quote ids', async () => {
		const shareView = makeInstance({
			mime: 'image/jpeg',
			serverVersion: '8.3.0',
			serverInfoVersion: '8.3.0',
			isShareExtension: true
		});
		shareView.state.attachments[0].canUpload = true;
		shareView.state = {
			...shareView.state,
			selected: shareView.state.attachments[0]
		};
		shareView.saveSelectedDescription = jest.fn() as any;

		shareView.messageActionStore.getState().actions.setQuoteMessageIds(['msg-1']);

		const prepareQuoteMessageMod = require('../../containers/MessageComposer/helpers/prepareQuoteMessage');
		const prepareSpy = jest.spyOn(prepareQuoteMessageMod, 'prepareQuoteMessage').mockResolvedValue('quoted-text');

		const sendFileMessageMod = require('../../lib/methods/sendFileMessage');
		const spy = jest.spyOn(sendFileMessageMod, 'sendFileMessage').mockResolvedValue(undefined);

		await shareView.send();

		expect(prepareSpy).toHaveBeenCalledWith('', ['msg-1']);
		const fileArg = spy.mock.calls[0]?.[1] as { msg?: string } | undefined;
		expect(fileArg?.msg).toBe('quoted-text');

		spy.mockRestore();
		prepareSpy.mockRestore();
	});

	it('send() clears the origin and closes before an attachment upload completes', async () => {
		const shareView = makeInstance({ mime: 'image/jpeg', serverVersion: '8.5.0' });
		shareView.state.attachments[0].canUpload = true;
		shareView.saveSelectedDescription = jest.fn() as any;
		const finishShareView = jest.fn();
		const sendFileMessageMod = require('../../lib/methods/sendFileMessage');
		let resolveUpload!: () => void;
		const uploadSpy = jest
			.spyOn(sendFileMessageMod, 'sendFileMessage')
			.mockImplementationOnce(() => new Promise<void>(resolve => (resolveUpload = resolve)));
		(shareView as any).finishShareView = finishShareView;
		(shareView as any).messageComposerRef = { current: { getText: () => 'caption', setInput: jest.fn() } };

		shareView.send();
		await Promise.resolve();

		expect(finishShareView).toHaveBeenCalledWith('', []);
		expect((shareView as any).sentMessage).toBe(true);
		expect(shareView.props.navigation.pop as jest.Mock).toHaveBeenCalledTimes(1);
		shareView.componentWillUnmount();
		expect(finishShareView).toHaveBeenCalledTimes(1);

		resolveUpload();
		await Promise.resolve();
		uploadSpy.mockRestore();
	});

	it('send() attempts to return current text when an upload fails after closing', async () => {
		const shareView = makeInstance({ mime: 'image/jpeg', serverVersion: '8.5.0' });
		shareView.state.attachments[0].canUpload = true;
		const finishShareView = jest.fn();
		(shareView as any).finishShareView = finishShareView;
		(shareView as any).messageComposerRef = { current: { getText: () => 'typed after start' } };
		shareView.messageActionStore.getState().actions.setQuoteMessageIds(['quote-after-send']);
		const sendFileMessageMod = require('../../lib/methods/sendFileMessage');
		let rejectUpload!: (error: Error) => void;
		const uploadSpy = jest
			.spyOn(sendFileMessageMod, 'sendFileMessage')
			.mockImplementationOnce(() => new Promise<void>((_, reject) => (rejectUpload = reject)));

		const sendPromise = shareView.send();
		await Promise.resolve();
		await Promise.resolve();
		shareView.componentWillUnmount();
		(shareView as any).messageComposerRef = { current: null };
		rejectUpload(new Error('upload failed'));
		await sendPromise;

		expect(finishShareView).toHaveBeenNthCalledWith(1, '', []);
		expect(finishShareView).toHaveBeenNthCalledWith(2, undefined, ['quote-after-send']);
		uploadSpy.mockRestore();
	});

	it('cancelled return restores current input and quote ids when ShareView unmounts', () => {
		const shareView = makeInstance({ mime: 'image/jpeg', serverVersion: '8.5.0' });
		const finishShareView = jest.fn();
		(shareView as any).finishShareView = finishShareView;
		(shareView as any).messageComposerRef = { current: { getText: () => 'typed caption' } };
		shareView.messageActionStore.getState().actions.setQuoteMessageIds(['quote-1', 'quote-2']);

		shareView.componentWillUnmount();

		expect(finishShareView).toHaveBeenCalledWith('typed caption', ['quote-1', 'quote-2']);
	});

	it('delays ShareView initialization until the Fabric synchronization timer completes', async () => {
		jest.useFakeTimers();
		const shareView = makeInstance({ mime: 'image/jpeg', serverVersion: '8.5.0' });
		const setInput = jest.fn();
		(shareView as any).messageComposerRef = { current: { setInput } };
		(shareView.props.route.params as any).startShareView = jest.fn(() => ({
			text: 'shared text',
			selectedMessages: ['quote-1']
		}));

		const initialization = shareView.startShareView();
		await Promise.resolve();
		expect(setInput).not.toHaveBeenCalled();
		jest.advanceTimersByTime(99);
		await Promise.resolve();
		expect(setInput).not.toHaveBeenCalled();
		jest.advanceTimersByTime(1);
		await initialization;

		expect(setInput).toHaveBeenCalledWith('shared text');
		expect(shareView.getSelectedMessageIds()).toEqual(['quote-1']);
		jest.useRealTimers();
	});

	it('keeps selected attachment fallback and reload behavior when attachments are removed', () => {
		const shareView = makeInstance({ mime: 'image/jpeg', serverVersion: '8.5.0' });
		const first = shareView.state.attachments[0];
		const second = { filename: 'second.jpg', path: '/tmp/second.jpg', size: 1, mime: 'image/jpeg', description: 'second text' };
		const third = { filename: 'third.jpg', path: '/tmp/third.jpg', size: 1, mime: 'image/jpeg', description: 'third text' };
		const fourth = { filename: 'fourth.jpg', path: '/tmp/fourth.jpg', size: 1, mime: 'image/jpeg', description: 'fourth text' };
		shareView.state.attachments.push(second as any, third as any, fourth as any);
		shareView.state.selected = second as any;
		const setInput = jest.fn();
		const getText = jest.fn(() => 'typed selected text');
		(shareView as any).messageComposerRef = { current: { getText, setInput } };

		shareView.removeFile(first as any);
		expect(shareView.state.attachments.map((attachment: { path?: string }) => attachment.path)).toEqual([
			'/tmp/second.jpg',
			'/tmp/third.jpg',
			'/tmp/fourth.jpg'
		]);
		expect(shareView.state.selected).toBe(second);
		expect(setInput).toHaveBeenLastCalledWith('second text');
		expect(getText).not.toHaveBeenCalled();

		shareView.removeFile(second as any);
		expect(shareView.state.selected).toBe(third);
		expect(setInput).toHaveBeenLastCalledWith('third text');

		shareView.state.selected = fourth as any;
		shareView.removeFile(fourth as any);
		expect(shareView.state.selected).toBe(third);
		expect(setInput).toHaveBeenLastCalledWith('third text');

		shareView.removeFile(third as any);
		expect(shareView.state.selected).toEqual({});
		expect(setInput).toHaveBeenLastCalledWith('');
		expect(getText).not.toHaveBeenCalled();
	});

	it('completes the share extension text-only send', async () => {
		const shareView = makeInstance({ mime: 'text/plain', serverVersion: '8.5.0', isShareExtension: true });
		shareView.state.attachments = [];
		shareView.state.text = 'shared extension text';
		const sendMessage = require('../../lib/methods/sendMessage').sendMessage as jest.Mock;
		let resolveSend!: () => void;
		sendMessage.mockImplementationOnce(() => new Promise<void>(resolve => (resolveSend = resolve)));
		const sendPromise = shareView.send();
		await Promise.resolve();

		expect(sendMessage).toHaveBeenCalledWith('room-id', 'shared extension text', '', expect.objectContaining({ id: 'user-id' }));
		expect(shareView.state.loading).toBe(true);
		expect(shareView.props.dispatch).not.toHaveBeenCalled();
		resolveSend();
		await sendPromise;
		expect(shareView.props.dispatch).toHaveBeenCalledWith(appStart({ root: RootEnum.ROOT_INSIDE }));
	});

	it('sends ordinary ShareView text-only content before popping', async () => {
		const shareView = makeInstance({ mime: 'text/plain', serverVersion: '8.5.0' });
		shareView.state.attachments = [];
		shareView.state.text = 'ordinary shared text';
		const finishShareView = jest.fn();
		(shareView as any).finishShareView = finishShareView;
		const sendMessage = require('../../lib/methods/sendMessage').sendMessage as jest.Mock;

		await shareView.send();

		expect(sendMessage).toHaveBeenCalledWith('room-id', 'ordinary shared text', '', expect.objectContaining({ id: 'user-id' }));
		expect(finishShareView).toHaveBeenCalledWith('', []);
		expect(shareView.props.navigation.pop).toHaveBeenCalledTimes(1);
	});

	it('bridges real origin media callbacks into ShareView and restores current text and Quotes', async () => {
		jest.useFakeTimers();
		const documentPicker = require('expo-document-picker').getDocumentAsync as jest.Mock;
		const navigate = require('../../lib/navigation/appNavigation').navigate as jest.Mock;
		const getSubscriptionByRoomId = require('../../lib/database/services/Subscription').getSubscriptionByRoomId as jest.Mock;
		documentPicker.mockResolvedValue({
			canceled: false,
			assets: [{ name: 'legacy.pdf', size: 12, mimeType: 'application/pdf', uri: 'file:///tmp/legacy.pdf' }]
		});
		getSubscriptionByRoomId.mockResolvedValue({
			rid: 'room-id',
			t: 'c',
			roles: [],
			update: jest.fn(),
			observe: () => ({ subscribe: () => ({ unsubscribe: jest.fn() }) })
		});

		const originStore = createMessageActionStore();
		act(() => originStore.getState().actions.setQuoteMessageIds(['origin-quote']));
		const originComposerRef = createRef<IMessageComposerRef>();
		let chooseFile!: () => Promise<void>;
		render(
			<Provider store={mockedStore}>
				<RoomProviders store={originStore} rid='room-id' t='c' room={{ rid: 'room-id', t: 'c' } as any}>
					<MessageComposerContainer ref={originComposerRef}>
						<OriginMediaProbe onReady={callback => (chooseFile = callback)} />
					</MessageComposerContainer>
				</RoomProviders>
			</Provider>
		);
		await act(async () => {
			await Promise.resolve();
			fireEvent.changeText(screen.getByTestId('message-composer-input'), 'origin text');
		});
		await act(async () => {
			await chooseFile();
		});

		const navigationParams = navigate.mock.calls[0][1];
		expect(navigationParams.startShareView().text).toBe('origin text');
		expect(navigationParams.startShareView().selectedMessages).toEqual(['origin-quote']);

		const shareView = makeInstance({ mime: 'application/pdf', serverVersion: '8.3.0' });
		shareView.state.attachments = navigationParams.attachments;
		shareView.state.selected = navigationParams.attachments[0];
		(shareView as any).finishShareView = navigationParams.finishShareView;
		(shareView as any).props.route.params.startShareView = navigationParams.startShareView;
		const shareRender = render(<Provider store={mockedStore}>{shareView.renderContent()}</Provider>);

		const initialization = shareView.startShareView();
		await act(async () => {
			jest.advanceTimersByTime(100);
			await initialization;
		});
		act(() => fireEvent.changeText(screen.getByTestId('message-composer-input-share'), 'Share text'));
		act(() => {
			shareView.messageActionStore.getState().actions.setQuoteMessageIds(['share-quote']);
			shareView.componentWillUnmount();
		});

		expect(originComposerRef.current?.getText()).toBe('Share text');
		expect(originStore.getState().action).toEqual({ kind: 'quote', messageIds: ['share-quote'] });
		act(() => shareRender.unmount());
		jest.useRealTimers();
	});

	it.each(['success', 'failure'] as const)('bridges real callbacks through ShareView send %s', async outcome => {
		jest.useFakeTimers();
		const documentPicker = require('expo-document-picker').getDocumentAsync as jest.Mock;
		const navigate = require('../../lib/navigation/appNavigation').navigate as jest.Mock;
		documentPicker.mockResolvedValue({
			canceled: false,
			assets: [{ name: 'legacy.pdf', size: 12, mimeType: 'application/pdf', uri: 'file:///tmp/legacy.pdf' }]
		});

		const originStore = createMessageActionStore();
		act(() => originStore.getState().actions.setQuoteMessageIds(['origin-quote']));
		const originComposerRef = createRef<IMessageComposerRef>();
		let chooseFile!: () => Promise<void>;
		render(
			<Provider store={mockedStore}>
				<RoomProviders store={originStore} rid='room-id' t='c' room={{ rid: 'room-id', t: 'c' } as any}>
					<MessageComposerContainer ref={originComposerRef}>
						<OriginMediaProbe onReady={callback => (chooseFile = callback)} />
					</MessageComposerContainer>
				</RoomProviders>
			</Provider>
		);
		await act(async () => {
			await Promise.resolve();
			fireEvent.changeText(screen.getByTestId('message-composer-input'), 'origin text');
		});
		await act(async () => {
			await chooseFile();
		});
		const navigationParams = navigate.mock.calls[0][1];

		const shareView = makeInstance({ mime: 'application/pdf', serverVersion: '8.3.0' });
		shareView.state.attachments = navigationParams.attachments.map((attachment: any) => ({ ...attachment, canUpload: true }));
		shareView.state.selected = shareView.state.attachments[0];
		(shareView as any).finishShareView = navigationParams.finishShareView;
		const shareRender = render(<Provider store={mockedStore}>{shareView.renderContent()}</Provider>);
		act(() => {
			fireEvent.changeText(screen.getByTestId('message-composer-input-share'), 'Share text');
			shareView.messageActionStore.getState().actions.setQuoteMessageIds(['share-quote']);
		});

		let completeUpload!: () => void;
		let failUpload!: (error: Error) => void;
		const sendFileMessageMod = require('../../lib/methods/sendFileMessage');
		const uploadSpy = jest.spyOn(sendFileMessageMod, 'sendFileMessage').mockImplementationOnce(
			() =>
				new Promise<void>((resolve, reject) => {
					completeUpload = resolve;
					failUpload = reject;
				})
		);
		fireEvent.press(screen.getByTestId('message-composer-send'));
		await Promise.resolve();
		await Promise.resolve();

		expect(originComposerRef.current?.getText()).toBe('');
		expect(originStore.getState().action).toBeNull();
		expect(shareView.props.navigation.pop).toHaveBeenCalledTimes(1);
		await act(async () => {
			shareRender.unmount();
			(shareView as any).messageComposerRef = { current: null };
			shareView.componentWillUnmount();
			await Promise.resolve();
		});

		if (outcome === 'success') {
			await act(async () => {
				completeUpload();
				await Promise.resolve();
			});
		} else {
			await act(async () => {
				failUpload(new Error('upload failed'));
				await Promise.resolve();
			});
		}
		await Promise.resolve();
		await Promise.resolve();

		expect(originComposerRef.current?.getText()).toBe('');
		expect(shareView.getSelectedMessageIds()).toEqual(['share-quote']);
		const expectedOriginAction = outcome === 'failure' ? { kind: 'quote', messageIds: ['share-quote'] } : null;
		expect(originStore.getState().action).toEqual(expectedOriginAction);
		uploadSpy.mockRestore();
		jest.useRealTimers();
	});

	it('saves and restores selected attachment text through the rendered composer', () => {
		const view = makeInstance({ mime: 'image/jpeg', serverVersion: '8.5.0' });
		const first = view.state.attachments[0];
		const second = { filename: 'second.jpg', path: '/tmp/second.jpg', size: 1, mime: 'image/jpeg', description: 'saved second' };
		view.state.attachments.push(second as any);
		render(<Provider store={mockedStore}>{view.renderContent()}</Provider>);
		act(() => fireEvent.changeText(screen.getByTestId('message-composer-input-share'), 'first caption'));

		act(() => view.selectFile(second as any));
		expect(first.description).toBe('first caption');
		expect((view as any).messageComposerRef.current?.getText()).toBe('saved second');
		act(() => fireEvent.changeText(screen.getByTestId('message-composer-input-share'), 'second caption'));

		act(() => view.selectFile(first as any));
		expect((view as any).messageComposerRef.current?.getText()).toBe('first caption');
		act(() => view.selectFile(second as any));
		expect((view as any).messageComposerRef.current?.getText()).toBe('second caption');
	});

	it('flushes selected attachment text through the rendered composer before sending', async () => {
		const view = makeInstance({ mime: 'image/jpeg', serverVersion: '8.5.0' });
		view.state.attachments[0].canUpload = true;
		const attachment = view.state.attachments[0];
		(view as any).finishShareView = jest.fn();
		act(() => view.messageActionStore.getState().actions.setQuoteMessageIds(['quote-1']));

		render(<Provider store={mockedStore}>{view.renderContent()}</Provider>);
		const input = screen.getByTestId('message-composer-input-share');
		act(() => fireEvent.changeText(input, 'caption before send'));

		const sendFileMessageMod = require('../../lib/methods/sendFileMessage');
		const uploadSpy = jest.spyOn(sendFileMessageMod, 'sendFileMessage').mockResolvedValueOnce(undefined);
		const prepareQuoteMessageMod = require('../../containers/MessageComposer/helpers/prepareQuoteMessage');
		const prepareSpy = jest.spyOn(prepareQuoteMessageMod, 'prepareQuoteMessage').mockResolvedValueOnce('quoted text');
		await act(async () => {
			fireEvent.press(screen.getByTestId('message-composer-send'));
			await Promise.resolve();
		});

		expect(attachment.description).toBe('caption before send');
		expect(prepareSpy).toHaveBeenCalledWith('', ['quote-1']);
		expect((view as any).finishShareView).toHaveBeenCalledWith('', []);
		uploadSpy.mockRestore();
		prepareSpy.mockRestore();
	});
});
