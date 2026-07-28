import { act, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { BehaviorSubject, Subject } from 'rxjs';

import { RoomView } from './index';
import { type IRoomViewProps } from './definitions';
import RoomServices from './services';
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

jest.mock('./services', () => ({
	__esModule: true,
	default: { getMessages: jest.fn().mockResolvedValue(undefined) }
}));
jest.mock('../../lib/methods/readMessages', () => ({ readMessages: jest.fn().mockResolvedValue(undefined) }));
jest.mock('../../lib/methods/loadThreadMessages', () => ({ loadThreadMessages: jest.fn().mockResolvedValue(undefined) }));
jest.mock('../../lib/methods/helpers/isReadOnly', () => ({ isReadOnly: jest.fn().mockResolvedValue(false) }));
jest.mock('../../lib/methods/AudioManager', () => ({
	__esModule: true,
	default: { pauseAudio: jest.fn(), unloadRoomAudios: jest.fn().mockResolvedValue(undefined) }
}));

const mockedGetMessages = RoomServices.getMessages as jest.Mock;
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
	} as unknown as IRoomViewProps);

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

// The awaited microtask is what lets queued promises settle inside act.
const flush = (mutate?: () => void) =>
	act(async () => {
		mutate?.();
		await Promise.resolve();
	});

describe('RoomView notification-tap race', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedGetMessages.mockResolvedValue(undefined);
		mockedReadMessages.mockResolvedValue(undefined);
		mockSubscriptionsCollection.find.mockRejectedValue(new Error('not found'));
	});

	it('loads messages for a route-param room that lacks a subscription row', async () => {
		mockSubscriptionsQuery.observe.mockReturnValue(new Subject());

		renderRoomView({ rid: 'rid-1', t: 'c' });
		await flush();

		expect(mockedGetMessages).toHaveBeenCalledWith({ rid: 'rid-1', t: 'c' });
		expect(mockedReadMessages).not.toHaveBeenCalled();
	});

	it('re-runs init exactly once when the subscription row materializes, and reads with its ls', async () => {
		const rows = new Subject<unknown[]>();
		mockSubscriptionsQuery.observe.mockReturnValue(rows);
		const row = buildRow();

		renderRoomView({ rid: 'rid-1', t: 'c' });
		await flush();
		expect(mockedGetMessages).toHaveBeenCalledTimes(1);

		await flush(() => rows.next([row]));

		expect(mockedGetMessages).toHaveBeenCalledTimes(2);
		expect(mockedGetMessages).toHaveBeenLastCalledWith({ rid: 'rid-1', t: 'c' });
		expect(mockedReadMessages).toHaveBeenCalledTimes(1);
		expect(mockedReadMessages).toHaveBeenCalledWith('rid-1', expect.any(Date));

		await flush(() => rows.next([buildRow({ id: 'sub-1-updated' })]));

		expect(mockedGetMessages).toHaveBeenCalledTimes(2);
		expect(mockedReadMessages).toHaveBeenCalledTimes(1);
	});

	it('self-heals when the subscription row arrives while getMessages is in flight', async () => {
		const rows = new Subject<unknown[]>();
		mockSubscriptionsQuery.observe.mockReturnValue(rows);
		const row = buildRow();
		let resolveGetMessages: (value?: unknown) => void = () => {};
		mockedGetMessages.mockImplementation(
			() =>
				new Promise(resolve => {
					resolveGetMessages = resolve;
				})
		);

		renderRoomView({ rid: 'rid-1', t: 'c' });
		await flush();
		expect(mockedGetMessages).toHaveBeenCalledTimes(1);

		// Subscription row lands mid-flight; the adoption callback re-triggers init(),
		// but it no-ops because this.initializing is still true.
		await flush(() => rows.next([row]));
		expect(mockedReadMessages).not.toHaveBeenCalled();

		// When the in-flight getMessages finally resolves, the post-await re-read
		// sees the adopted row and runs the unread/read-receipt path.
		await flush(() => resolveGetMessages());

		expect(mockedGetMessages).toHaveBeenCalledTimes(1);
		expect(mockedReadMessages).toHaveBeenCalledTimes(1);
		expect(mockedReadMessages).toHaveBeenCalledWith('rid-1', expect.any(Date));
	});
});

describe('RoomView init cursor predicate', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedGetMessages.mockResolvedValue(undefined);
		mockedReadMessages.mockResolvedValue(undefined);
	});

	it('routes a cursor-less subscribed room to the room-history loader directly', async () => {
		renderRoomView({ rid: 'rid-1', t: 'c', room: buildRow() });
		await flush();

		expect(mockedGetMessages).toHaveBeenCalledTimes(1);
		expect(mockedGetMessages).toHaveBeenCalledWith({ rid: 'rid-1', t: 'c' });
	});

	it('routes a subscribed room with a cursor to the missed-messages loader', async () => {
		renderRoomView({
			rid: 'rid-1',
			t: 'c',
			room: buildRow({ lastOpen: new Date('2026-01-01T00:00:00.000Z') })
		});
		await flush();

		expect(mockedGetMessages).toHaveBeenCalledTimes(1);
		expect(mockedGetMessages).toHaveBeenCalledWith({ rid: 'rid-1' });
	});
});

describe('RoomView bounded init retry', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.useFakeTimers();
		mockSubscriptionsCollection.find.mockRejectedValue(new Error('not found'));
		mockSubscriptionsQuery.observe.mockReturnValue(new Subject());
		mockedGetMessages.mockRejectedValue(new Error('boom'));
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('schedules at most 5 backing-off retries and then stops', async () => {
		const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

		renderRoomView({ rid: 'rid-1', t: 'c' });
		await flush();

		const retryDelays = () =>
			setTimeoutSpy.mock.calls.filter(([, delay]) => [300, 600, 1200, 2400, 4800].includes(delay as number)).map(([, d]) => d);

		for (let attempt = 0; attempt < 8; attempt += 1) {
			// Each retry must be drained before the next one is armed.
			// eslint-disable-next-line no-await-in-loop
			await flush(() => jest.runOnlyPendingTimers());
		}

		expect(retryDelays()).toEqual([300, 600, 1200, 2400, 4800]);
		// 1 initial attempt + 5 retries
		expect(mockedGetMessages).toHaveBeenCalledTimes(6);
	});

	it('stops retrying after unmount', async () => {
		const { unmount } = renderRoomView({ rid: 'rid-1', t: 'c' });
		// componentDidMount defers init() through InteractionManager, so drain that first.
		await flush(() => jest.runOnlyPendingTimers());

		const callsBeforeUnmount = mockedGetMessages.mock.calls.length;
		expect(callsBeforeUnmount).toBe(1);

		await flush(() => unmount());
		await flush(() => jest.runOnlyPendingTimers());

		expect(mockedGetMessages).toHaveBeenCalledTimes(callsBeforeUnmount);
	});
});
