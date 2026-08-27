import { act, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { BehaviorSubject, Subject } from 'rxjs';

import { RoomView } from './index';
import { type IRoomViewProps } from './definitions';
import { syncRoom } from '../../lib/methods/syncRoom';
import { readMessages } from '../../lib/methods/readMessages';
import { mockedStore } from '../../reducers/mockedStore';
import { initStore } from '../../lib/store/auxStore';
import { setUser } from '../../actions/login';

jest.mock('./List', () => 'List');
jest.mock('./LoadMore', () => 'LoadMore');
jest.mock('./UploadProgress', () => 'UploadProgress');
jest.mock('./JoinCode', () => 'JoinCode');
jest.mock('./Banner', () => 'Banner');
jest.mock('../../containers/MessageComposer', () => ({
	MessageComposerContainer: 'MessageComposerContainer',
	ComposerAttachments: 'ComposerAttachments'
}));
jest.mock('../../containers/MessageActions', () => 'MessageActions');
jest.mock('../../containers/MessageErrorActions', () => 'MessageErrorActions');
jest.mock('../../containers/message', () => 'Message');
jest.mock('../../lib/methods/subscriptions/room', () =>
	jest.fn().mockImplementation(() => ({
		subscribe: jest.fn(),
		unsubscribe: jest.fn()
	}))
);

jest.mock('../../lib/services/restApi', () => ({
	getRoutingConfig: jest.fn().mockResolvedValue({ returnQueue: false }),
	getUserInfo: jest.fn().mockResolvedValue({ success: false }),
	editMessage: jest.fn(),
	setReaction: jest.fn(),
	joinRoom: jest.fn(),
	toggleFollowMessage: jest.fn()
}));
jest.mock('../../lib/encryption/utils', () => ({
	isE2EEDisabledEncryptedRoom: () => false,
	isMissingRoomE2EEKey: () => false
}));

jest.mock('../../lib/hooks/useNewMediaCall', () => ({
	useNewMediaCall: () => ({ openNewMediaCall: jest.fn(), hasMediaCallPermission: false, isInActiveCall: false })
}));
jest.mock('../../lib/services/voip/isInActiveVoipCall', () => ({
	isInActiveVoipCall: () => false,
	useIsInActiveVoipCall: () => false
}));

jest.mock('../../lib/methods/syncRoom', () => ({ syncRoom: jest.fn().mockResolvedValue(undefined) }));
jest.mock('../../lib/methods/readMessages', () => ({ readMessages: jest.fn().mockResolvedValue(undefined) }));
jest.mock('../../lib/methods/loadThreadMessages', () => ({ loadThreadMessages: jest.fn().mockResolvedValue(undefined) }));
jest.mock('../../lib/methods/helpers/isReadOnly', () => ({ isReadOnly: jest.fn().mockResolvedValue(false) }));
jest.mock('../../lib/methods/AudioManager', () => ({
	__esModule: true,
	default: { pauseAudio: jest.fn(), unloadRoomAudios: jest.fn().mockResolvedValue(undefined) }
}));

const mockedSyncRoom = syncRoom as jest.Mock;
const mockedReadMessages = readMessages as jest.Mock;

const mockSubscriptionsQuery = { observe: jest.fn(), observeWithColumns: jest.fn(() => new Subject()) };
const mockSubscriptionsCollection = {
	query: jest.fn(() => mockSubscriptionsQuery),
	find: jest.fn()
};

jest.mock('../../lib/database', () => ({
	__esModule: true,
	default: {
		get active() {
			return { get: jest.fn(() => mockSubscriptionsCollection) };
		}
	}
}));

const buildProps = (params: Record<string, unknown>): IRoomViewProps =>
	({
		route: { params },
		navigation: { setOptions: jest.fn(), addListener: jest.fn(() => jest.fn()), navigate: jest.fn() },
		dispatch: jest.fn(),
		user: { id: 'u1', username: 'user', token: 't' },
		isAuthenticated: true,
		insets: { left: 0, right: 0, top: 0, bottom: 0 },
		theme: 'light',
		width: 400,
		height: 800,
		isMasterDetail: false,
		baseUrl: 'https://open.rocket.chat',
		serverVersion: '7.0.0',
		Message_GroupingPeriod: 300,
		Message_Read_Receipt_Enabled: false,
		Hide_System_Messages: [],
		encryptionEnabled: false,
		inAppFeedback: {},
		permissions: {},
		showActionSheet: jest.fn(),
		hideActionSheet: jest.fn(),
		fontScale: 1
	}) as unknown as IRoomViewProps;

// A WatermelonDB subscription row observes itself; only the fields RoomView reads matter here.
const buildRow = (overrides: Record<string, unknown> = {}) => {
	const row = {
		id: 'sub-1',
		rid: 'rid-1',
		t: 'c',
		name: 'room',
		encrypted: false,
		alert: true,
		unread: 1,
		userMentions: 0,
		ls: new Date('2026-01-01T00:00:00.000Z'),
		observe: () => new BehaviorSubject(row),
		...overrides
	};
	return row;
};

const renderRoomView = (params: Record<string, unknown>) =>
	render(
		<Provider store={mockedStore}>
			<RoomView {...buildProps(params)} />
		</Provider>
	);

beforeAll(() => {
	initStore(mockedStore);
	mockedStore.dispatch(setUser({ id: 'u1', username: 'user' }));
});

describe('RoomView init cursor predicate', () => {
	// The awaited microtask is what lets queued promises settle inside act.
	const flush = () =>
		act(async () => {
			await Promise.resolve();
		});

	beforeEach(() => {
		jest.clearAllMocks();
		mockedSyncRoom.mockResolvedValue(undefined);
		mockedReadMessages.mockResolvedValue(undefined);
		mockSubscriptionsCollection.find.mockRejectedValue(new Error('not found'));
		mockSubscriptionsQuery.observe.mockReturnValue(new Subject());
	});

	it('loads messages for a route-param room that lacks a subscription row', async () => {
		renderRoomView({ rid: 'rid-1', t: 'c' });
		await flush();

		expect(mockedSyncRoom).toHaveBeenCalledWith({ rid: 'rid-1', fallbackRoomType: 'c' });
		expect(mockedReadMessages).not.toHaveBeenCalled();
	});

	it('synchronizes a cursor-less subscribed room once', async () => {
		renderRoomView({ rid: 'rid-1', t: 'c', room: buildRow() });
		await flush();

		expect(mockedSyncRoom).toHaveBeenCalledTimes(1);
		expect(mockedSyncRoom).toHaveBeenCalledWith({ rid: 'rid-1', fallbackRoomType: 'c' });
	});

	it('synchronizes a subscribed room with a cursor once', async () => {
		renderRoomView({
			rid: 'rid-1',
			t: 'c',
			room: buildRow({ lastOpen: new Date('2026-01-01T00:00:00.000Z') })
		});
		await flush();

		expect(mockedSyncRoom).toHaveBeenCalledTimes(1);
		expect(mockedSyncRoom).toHaveBeenCalledWith({ rid: 'rid-1', fallbackRoomType: 'c' });
	});
});
