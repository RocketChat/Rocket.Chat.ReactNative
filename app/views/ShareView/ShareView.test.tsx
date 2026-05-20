import { type ReactNode } from 'react';

jest.mock('../../lib/database', () => ({
	servers: {
		get: jest.fn(() => ({
			find: jest.fn(() => Promise.resolve({}))
		}))
	}
}));

jest.mock('../../containers/MessageComposer', () => {
	const React = require('react');

	const MessageComposerContainer = React.forwardRef(({ children }: { children: ReactNode }, _ref: unknown) => children);
	MessageComposerContainer.displayName = 'MessageComposerContainer';

	return {
		MessageComposerContainer
	};
});

jest.mock('./Preview', () => () => null);
jest.mock('../../containers/Thumbs', () => () => null);
jest.mock('../../containers/ActionSheet', () => ({
	showActionSheetRef: jest.fn()
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
		mediaAllowList: undefined,
		selectedMessages: [],
		action: null
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
});
