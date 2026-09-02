import { type ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

jest.mock('../../../lib/database', () => ({
	servers: {
		get: jest.fn(() => ({
			find: jest.fn(() => Promise.resolve({}))
		}))
	}
}));

jest.mock('../../RoomView/stores/RoomStore', () => ({
	createStaticRoomStore: (room: unknown) => require('zustand').createStore(() => ({ room, roomUpdate: {} }))
}));

jest.mock('../../../containers/MessageComposer/MessageComposer', () => {
	const { createElement } = require('react');
	const { Pressable, View } = require('react-native');
	const {
		useComposerRoom,
		useComposerTmid,
		useOnRemoveQuoteMessage,
		useOnSendMessage
	} = require('../../../containers/MessageComposer/store');
	return {
		MessageComposer: () => {
			const room = useComposerRoom();
			const tmid = useComposerTmid();
			const onSendMessage = useOnSendMessage();
			const onRemoveQuoteMessage = useOnRemoveQuoteMessage();
			return createElement(View, { testID: 'share-composer', accessibilityLabel: `${room.rid}:${tmid}` }, [
				createElement(Pressable, { key: 'send', testID: 'share-send', onPress: () => onSendMessage('message') }),
				createElement(Pressable, {
					key: 'remove',
					testID: 'share-remove-quote',
					onPress: () => onRemoveQuoteMessage('message-id')
				})
			]);
		}
	};
});

jest.mock('../../../containers/MessageComposer/hooks/useEmojiKeyboard', () => {
	const { Fragment, createElement } = require('react');
	return {
		EmojiKeyboardProvider: ({ children }: { children: ReactNode }) => createElement(Fragment, null, children)
	};
});

jest.mock('../Preview', () => () => null);
jest.mock('../../../containers/Thumbs', () => () => null);
jest.mock('../../../containers/ActionSheet', () => ({
	showActionSheetRef: jest.fn()
}));
jest.mock('../../../containers/MessageComposer/components/Attachments/AttachmentActionSheet', () => ({
	AttachmentActionSheet: () => null
}));
jest.mock('../../../lib/methods/sendMessage', () => ({
	sendMessage: jest.fn()
}));

const { showActionSheetRef } = require('../../../containers/ActionSheet');
const { AttachmentActionSheet } = require('../../../containers/MessageComposer/components/Attachments/AttachmentActionSheet');
const { ShareView } = require('../index');

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

	it('provides sending, quote removal, room and thread id to the composer', () => {
		const shareView = makeInstance({ mime: 'image/jpeg', serverVersion: '8.5.0' });
		shareView.state.thread = 'thread-id';
		shareView.messageActionStore.getState().actions.setQuoteMessageIds(['message-id']);
		shareView.send = jest.fn();

		render(shareView.renderContent());

		expect(screen.getByTestId('share-composer').props.accessibilityLabel).toBe('room-id:thread-id');
		fireEvent.press(screen.getByTestId('share-send'));
		fireEvent.press(screen.getByTestId('share-remove-quote'));
		expect(shareView.send).toHaveBeenCalledWith('message', undefined);
		expect(shareView.getSelectedMessageIds()).toEqual([]);
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

		shareView.saveSelectedDescription = jest.fn() as any;

		const sendFileMessageMod = require('../../../lib/methods/sendFileMessage');
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

		const prepareQuoteMessageMod = require('../../../containers/MessageComposer/helpers/prepareQuoteMessage');
		const prepareSpy = jest.spyOn(prepareQuoteMessageMod, 'prepareQuoteMessage').mockResolvedValue('quoted-text');

		const sendFileMessageMod = require('../../../lib/methods/sendFileMessage');
		const spy = jest.spyOn(sendFileMessageMod, 'sendFileMessage').mockResolvedValue(undefined);

		await shareView.send();

		expect(prepareSpy).toHaveBeenCalledWith('', ['msg-1']);
		const fileArg = spy.mock.calls[0]?.[1] as { msg?: string } | undefined;
		expect(fileArg?.msg).toBe('quoted-text');

		spy.mockRestore();
		prepareSpy.mockRestore();
	});
});
