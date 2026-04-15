import { type ReactNode } from 'react';
import { render } from '@testing-library/react-native';

import { ShareView } from './index';

jest.mock('../../lib/database', () => ({
	servers: {
		get: jest.fn(() => ({
			find: jest.fn(() => Promise.resolve(undefined))
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
jest.mock('./Thumbs', () => () => null);

const makeInstance = ({ mime, serverVersion }: { mime: string; serverVersion?: string }) => {
	const shareView = new ShareView({
		navigation: {
			setOptions: jest.fn(),
			pop: jest.fn()
		} as any,
		route: {
			key: 'ShareView',
			name: 'ShareView',
			params: {
				action: null
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

	return shareView;
};

describe('ShareView', () => {
	it('renders the alt text field for image uploads on supported servers', () => {
		const shareView = makeInstance({ mime: 'image/jpeg', serverVersion: '8.5.0' });
		const { queryByTestId } = render(shareView.renderContent());

		expect(queryByTestId('share-view-alt-text')).toBeTruthy();
	});

	it('does not render the alt text field on servers at or below 8.4.0', () => {
		const shareView = makeInstance({ mime: 'image/jpeg', serverVersion: '8.3.0' });
		const { queryByTestId } = render(shareView.renderContent());

		expect(queryByTestId('share-view-alt-text')).toBeNull();
	});

	it('does not render the alt text field for non-image attachments', () => {
		const shareView = makeInstance({ mime: 'video/mp4', serverVersion: '8.5.0' });
		const { queryByTestId } = render(shareView.renderContent());

		expect(queryByTestId('share-view-alt-text')).toBeNull();
	});
});
