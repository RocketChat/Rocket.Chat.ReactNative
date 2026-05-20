import { type ReactNode } from 'react';
import { render } from '@testing-library/react-native';

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
jest.mock('../../lib/methods/sendMessage', () => ({
	sendMessage: jest.fn()
}));

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
		action: null,
		altText: ''
	};

	if (serverInfoVersion) {
		(shareView as any).serverInfo = { version: serverInfoVersion };
		(shareView as any).isShareExtension = isShareExtension;
	}

	return shareView;
};

describe('ShareView', () => {
	it('renders the alt text field for image uploads on supported servers', () => {
		const shareView = makeInstance({ mime: 'image/jpeg', serverVersion: '8.5.0' });
		const { queryByTestId } = render(shareView.renderContent());

		expect(queryByTestId('share-view-alt-text')).toBeTruthy();
	});

	it('renders the alt text field on exactly 8.4.0', () => {
		const shareView = makeInstance({ mime: 'image/jpeg', serverVersion: '8.4.0' });
		const { queryByTestId } = render(shareView.renderContent());

		expect(queryByTestId('share-view-alt-text')).toBeTruthy();
	});

	it('does not render the alt text field on servers below 8.4.0', () => {
		const shareView = makeInstance({ mime: 'image/jpeg', serverVersion: '8.3.0' });
		const { queryByTestId } = render(shareView.renderContent());

		expect(queryByTestId('share-view-alt-text')).toBeNull();
	});

	it('does not render the alt text field for non-image attachments', () => {
		const shareView = makeInstance({ mime: 'video/mp4', serverVersion: '8.5.0' });
		const { queryByTestId } = render(shareView.renderContent());

		expect(queryByTestId('share-view-alt-text')).toBeNull();
	});

	it('share extension uses serverInfo version, not Redux serverVersion', () => {
		// Redux reports an old server, but the target workspace is >= 8.4.0
		const shareView = makeInstance({
			mime: 'image/jpeg',
			serverVersion: '8.3.0',
			serverInfoVersion: '8.5.0',
			isShareExtension: true
		});
		const { queryByTestId } = render(shareView.renderContent());

		expect(queryByTestId('share-view-alt-text')).toBeTruthy();
	});

	it('share extension hides alt text field when serverInfo version is below 8.4.0', () => {
		// Redux reports a new server, but the target workspace is old
		const shareView = makeInstance({
			mime: 'image/jpeg',
			serverVersion: '8.5.0',
			serverInfoVersion: '8.3.0',
			isShareExtension: true
		});
		const { queryByTestId } = render(shareView.renderContent());

		expect(queryByTestId('share-view-alt-text')).toBeNull();
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

		shareView.selectFile = jest.fn().mockResolvedValue(undefined) as any;

		const sendFileMessageMod = require('../../lib/methods/sendFileMessage');
		const spy = jest.spyOn(sendFileMessageMod, 'sendFileMessage').mockResolvedValue(undefined);

		await shareView.send();

		const fileArg = spy.mock.calls[0]?.[1] as { description?: string; msg?: string } | undefined;
		expect(fileArg?.description).toBe('a cat on a mat');
		expect(fileArg?.msg).toBe('my caption');

		spy.mockRestore();
	});
});
