import { type ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { createStore } from 'redux';

import RoomView from '../index';
import { type IRoomViewProps } from '../definitions';
import { loadThreadMessages } from '../../../lib/methods/loadThreadMessages';

// A thread mounts a second RoomView on the parent's rid, so both screens share one rid-keyed store.
// This harness mounts that pair and is reusable by any test about per-screen vs per-room state.

jest.mock('../../../i18n', () => ({
	__esModule: true,
	default: { t: (key: string) => key }
}));

jest.mock('../../../containers/Touch', () => {
	const { createElement } = require('react');
	const { Pressable } = require('react-native');
	return {
		__esModule: true,
		default: ({ children, ...props }: { children: ReactNode }) => createElement(Pressable, props, children)
	};
});

// The JoinCode modal is per-screen: the mock records which screen's ref was triggered.
jest.mock('../components/JoinCode', () => {
	const { createElement, useImperativeHandle, useState } = require('react');
	const { View } = require('react-native');
	return {
		__esModule: true,
		default: ({ ref }: { ref: { current: unknown } }) => {
			const [visible, setVisible] = useState(false);
			useImperativeHandle(ref, () => ({ show: () => setVisible(true) }));
			return visible ? createElement(View, { testID: 'join-code' }) : null;
		}
	};
});

jest.mock('../List', () => ({ __esModule: true, default: 'List' }));
jest.mock('../components/RoomMessageActions', () => ({ RoomMessageActions: 'RoomMessageActions' }));
jest.mock('../components/UploadProgress', () => ({ __esModule: true, default: 'UploadProgress' }));
jest.mock('../components/RoomMessageHandlersBridge', () => ({
	RoomMessageHandlersBridge: ({ children }: { children: ReactNode }) => children
}));
jest.mock('../hooks/useHeader', () => ({ useHeader: jest.fn() }));
jest.mock('../hooks/useRoomSubscription', () => ({ useRoomSubscription: jest.fn() }));
jest.mock('../hooks/useRoomAudioLifecycle', () => ({ useRoomAudioLifecycle: jest.fn() }));
jest.mock('../hooks/useRoomRemoved', () => ({ useRoomRemoved: jest.fn() }));
jest.mock('../hooks/useInAppFeedback', () => ({ useInAppFeedback: jest.fn() }));
jest.mock('../hooks/useOmnichannelPermissions', () => ({ useOmnichannelPermissions: jest.fn() }));
jest.mock('../hooks/useE2EEStatus', () => ({ useE2EEStatus: jest.fn(() => ({})) }));
jest.mock('../hooks/useMessageActions', () => ({ useMessageActions: jest.fn(() => ({})) }));
jest.mock('../hooks/useRoomNavigation', () => ({ useRoomNavigation: jest.fn(() => ({})) }));
jest.mock('../../../containers/ActionSheet', () => ({
	useActionSheet: () => ({ showActionSheet: jest.fn(), hideActionSheet: jest.fn() })
}));
jest.mock('../../../lib/methods/subscriptions/room', () => ({ __esModule: true, default: class RoomClass {} }));
jest.mock('../../../lib/methods/helpers', () => ({
	getUidDirectMessage: jest.fn(),
	getRoomTitle: jest.fn(() => 'Room Title'),
	isGroupChat: jest.fn(() => false),
	canAutoTranslate: jest.fn(() => false)
}));
jest.mock('../../../lib/methods/helpers/log', () => ({
	__esModule: true,
	default: jest.fn(),
	logEvent: jest.fn(),
	events: {}
}));
jest.mock('../../../lib/methods/isInviteSubscription', () => ({ isInviteSubscription: jest.fn(() => false) }));
jest.mock('../services/getMessages', () => ({ __esModule: true, default: jest.fn(() => Promise.resolve()) }));
jest.mock('../../../lib/methods/loadThreadMessages', () => ({ loadThreadMessages: jest.fn(() => Promise.resolve()) }));
jest.mock('../../../lib/methods/readMessages', () => ({ readMessages: jest.fn(() => Promise.resolve()) }));
jest.mock('../../../lib/services/restApi', () => ({ joinRoom: jest.fn(() => Promise.resolve()), getUserInfo: jest.fn() }));
jest.mock('../../../ee/omnichannel/lib', () => ({
	takeInquiry: jest.fn(() => Promise.resolve()),
	takeResume: jest.fn(() => Promise.resolve())
}));
jest.mock('../../../lib/store/auxStore', () => ({ store: { getState: () => ({ server: { version: '6.1.0' } }) } }));

// No subscription row for this rid: the observer emits an empty result, which drops `joined` to
// false and puts both screens in the preview (Join) footer state.
jest.mock('../../../lib/database', () => ({
	__esModule: true,
	default: {
		active: {
			get: () => ({
				query: () => ({
					observeWithColumns: () => ({
						subscribe: (next: (rows: unknown[]) => void) => {
							next([]);
							return { unsubscribe: jest.fn() };
						}
					})
				})
			})
		}
	}
}));

const RID = 'rid-shared';

const makeReduxStore = () =>
	createStore(() => ({
		login: { user: { id: 'u1', username: 'tester', token: 't', roles: [] }, isAuthenticated: true },
		server: { server: 'https://open.rocket.chat', version: '6.1.0' },
		settings: {},
		permissions: {},
		enterpriseModules: [],
		app: { isMasterDetail: false }
	}));

const makeProps = (params: Record<string, unknown>): IRoomViewProps =>
	({
		route: { params },
		navigation: { setOptions: jest.fn(), navigate: jest.fn(), goBack: jest.fn() }
	}) as unknown as IRoomViewProps;

/**
 * Renders the room screen plus, optionally, a thread screen on the same rid — the pair a user
 * gets after opening a thread. Re-render with `withThread: false` to unmount the thread screen.
 */
const renderRoomAndThread = ({ startWithThread = true }: { startWithThread?: boolean } = {}) => {
	const reduxStore = makeReduxStore();
	const roomParams = { rid: RID, t: 'c', name: 'general', joinCodeRequired: true };
	const Screens = ({ withThread }: { withThread: boolean }) => (
		<Provider store={reduxStore}>
			<RoomView {...makeProps(roomParams)} />
			{withThread ? <RoomView {...makeProps({ ...roomParams, tmid: 'tmid-1', name: 'thread' })} /> : null}
		</Provider>
	);
	const { rerender } = render(<Screens withThread={startWithThread} />);
	return {
		openThread: () => rerender(<Screens withThread />),
		closeThread: () => rerender(<Screens withThread={false} />)
	};
};

describe('RoomView screens sharing one rid-keyed store', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.mocked(loadThreadMessages).mockResolvedValue(undefined);
	});

	it('mounts a room screen and a thread screen on the same rid', () => {
		renderRoomAndThread();

		expect(screen.getAllByTestId('room-view-join-button')).toHaveLength(2);
	});

	it('still opens the join-code modal from the room screen after the thread screen unmounts', async () => {
		const { closeThread } = renderRoomAndThread();

		closeThread();
		await waitFor(() => expect(screen.getByTestId('room-view-join-button')).toBeEnabled());
		fireEvent.press(screen.getByTestId('room-view-join-button'));

		expect(screen.getByTestId('join-code')).toBeOnTheScreen();
	});

	// `loading` is per-screen: a thread mounting mid-load must not disable the room screen's button.
	it('keeps the room screen footer enabled while a freshly mounted thread screen is still loading', async () => {
		// The thread's init never settles, so its screen stays in the loading state for the assertion.
		jest.mocked(loadThreadMessages).mockReturnValue(new Promise<void>(() => {}));
		const { openThread } = renderRoomAndThread({ startWithThread: false });
		await waitFor(() => expect(screen.getByTestId('room-view-join-button')).toBeEnabled());

		openThread();

		const [roomButton, threadButton] = screen.getAllByTestId('room-view-join-button');
		expect(roomButton).toBeEnabled();
		expect(threadButton).toBeDisabled();
	});
});
