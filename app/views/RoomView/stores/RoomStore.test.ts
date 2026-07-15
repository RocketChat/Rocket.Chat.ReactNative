import database from '../../../lib/database';
import { loadThreadMessages } from '../../../lib/methods/loadThreadMessages';
import { getUserInfo } from '../../../lib/services/restApi';
import { isGroupChat } from '../../../lib/methods/helpers';
import { isInviteSubscription } from '../../../lib/methods/isInviteSubscription';
import log from '../../../lib/methods/helpers/log';
import { roomAttrsUpdate, roomAttrsUpdateColumns } from '../constants';
import getMessages from '../services/getMessages';
import { getOrCreateRoomStore, releaseRoomStore } from './RoomStore';

jest.mock('../../../lib/database', () => ({
	__esModule: true,
	default: { active: { get: jest.fn() } }
}));
jest.mock('../services/getMessages', () => ({
	__esModule: true,
	default: jest.fn(() => Promise.resolve())
}));
jest.mock('../../../lib/methods/loadThreadMessages', () => ({
	loadThreadMessages: jest.fn(() => Promise.resolve())
}));
jest.mock('../../../lib/methods/readMessages', () => ({
	readMessages: jest.fn(() => Promise.resolve())
}));
jest.mock('../../../lib/services/restApi', () => ({
	getUserInfo: jest.fn()
}));
jest.mock('../../../lib/methods/helpers', () => ({
	getUidDirectMessage: jest.fn(() => 'uid-1'),
	isGroupChat: jest.fn(() => false),
	canAutoTranslate: jest.fn(() => true)
}));
jest.mock('../../../lib/methods/isInviteSubscription', () => ({
	isInviteSubscription: jest.fn(() => false)
}));
jest.mock('../../../lib/methods/helpers/log', () => jest.fn());

const mockGet = database.active.get as jest.Mock;
const mockGetMessages = getMessages as unknown as jest.Mock;
const mockLoadThreadMessages = loadThreadMessages as jest.Mock;
const mockGetUserInfo = getUserInfo as jest.Mock;
const mockIsGroupChat = isGroupChat as jest.Mock;
const mockIsInviteSubscription = isInviteSubscription as unknown as jest.Mock;
const mockLog = log as jest.Mock;

const stubRoom = { rid: 'rid-1', t: 'c' };
const subRoom = { id: 'sub-1', rid: 'rid-1', t: 'c', name: 'general' };

const setupObserve = () => {
	let emit: ((rows: any[]) => void) | undefined;
	const unsubscribe = jest.fn();
	const observeWithColumns = jest.fn(() => ({
		subscribe: (cb: (rows: any[]) => void) => {
			emit = cb;
			return { unsubscribe };
		}
	}));
	const query = jest.fn(() => ({ observeWithColumns }));
	mockGet.mockReturnValue({ query });
	return {
		observeWithColumns,
		query,
		unsubscribe,
		emit: (rows: any[]) => emit?.(rows)
	};
};

describe('RoomStore', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockIsGroupChat.mockReturnValue(false);
		mockIsInviteSubscription.mockReturnValue(false);
		mockGetMessages.mockResolvedValue(undefined);
		mockLoadThreadMessages.mockResolvedValue(undefined);
	});

	// Isolate cases through the public release API instead of a test-only registry reset. Every case
	// acquires 'rid-1' at most twice; release is a no-op once the entry's refcount hits zero.
	afterEach(() => {
		releaseRoomStore('rid-1');
		releaseRoomStore('rid-1');
	});

	it('exposes the initial room synchronously on creation', () => {
		setupObserve();
		const store = getOrCreateRoomStore({ rid: 'rid-1', initialRoom: stubRoom });

		expect(store.getState().room).toBe(stubRoom);
		expect(store.getState().joined).toBe(true);
		expect(store.getState().subscribed).toBe(false);
		expect(store.getState().member).toEqual({});
		expect(store.getState().loading).toBe(true);
	});

	it('marks subscribed and joined when the subscription observable emits a row', () => {
		const { emit } = setupObserve();
		const store = getOrCreateRoomStore({ rid: 'rid-1', t: 'c', initialRoom: stubRoom });

		emit([subRoom]);

		expect(store.getState().room).toBe(subRoom);
		expect(store.getState().subscribed).toBe(true);
		expect(store.getState().joined).toBe(true);
	});

	it('flips to preview mode (not subscribed, not joined) when a non-DM has no subscription', () => {
		const { emit } = setupObserve();
		const store = getOrCreateRoomStore({ rid: 'rid-1', t: 'c', initialRoom: stubRoom });

		emit([]);

		expect(store.getState().subscribed).toBe(false);
		expect(store.getState().joined).toBe(false);
		expect(store.getState().room).toBe(stubRoom);
	});

	it('keeps a DM joined even with no subscription yet', () => {
		const { emit } = setupObserve();
		const store = getOrCreateRoomStore({ rid: 'rid-1', t: 'd', initialRoom: stubRoom });

		emit([]);

		expect(store.getState().subscribed).toBe(false);
		expect(store.getState().joined).toBe(true);
	});

	it('flips joined back to true once the subscription appears later', () => {
		const { emit } = setupObserve();
		const store = getOrCreateRoomStore({ rid: 'rid-1', t: 'c', initialRoom: stubRoom });

		emit([]);
		expect(store.getState().joined).toBe(false);

		emit([subRoom]);
		expect(store.getState().joined).toBe(true);
		expect(store.getState().subscribed).toBe(true);
	});

	it('rebuilds a fresh roomUpdate snapshot when the same model instance re-emits a mutated column', () => {
		const { emit } = setupObserve();
		const mutable = { ...subRoom, topic: 'old' };
		const store = getOrCreateRoomStore({ rid: 'rid-1', t: 'c', initialRoom: stubRoom });

		emit([mutable]);
		const first = store.getState().roomUpdate;
		expect(first.topic).toBe('old');

		// observeWithColumns re-emits the same cached instance, mutated in place
		mutable.topic = 'new';
		emit([mutable]);

		expect(store.getState().room).toBe(mutable);
		expect(store.getState().roomUpdate.topic).toBe('new');
		expect(store.getState().roomUpdate).not.toBe(first);
	});

	it('observes with exactly the roomAttrsUpdateColumns values', () => {
		const { observeWithColumns } = setupObserve();
		getOrCreateRoomStore({ rid: 'rid-1', initialRoom: stubRoom });

		expect(observeWithColumns).toHaveBeenCalledWith(Object.values(roomAttrsUpdateColumns));
	});

	it('runs the main init path: fetches messages, ends loading, sets member and canAutoTranslate', async () => {
		setupObserve();
		const store = getOrCreateRoomStore({ rid: 'rid-1', t: 'c', initialRoom: subRoom });

		await store.getState().init();

		expect(mockGetMessages).toHaveBeenCalledWith(expect.objectContaining({ rid: 'rid-1', t: 'c' }));
		expect(store.getState().loading).toBe(false);
		expect(store.getState().member).toEqual({});
		expect(store.getState().canAutoTranslate).toBe(true);
	});

	it('runs the thread init path when tmid is set: loads thread messages and fires the callback', async () => {
		setupObserve();
		const onThreadMessagesLoaded = jest.fn();
		const store = getOrCreateRoomStore({ rid: 'rid-1', initialRoom: subRoom });

		await store.getState().init({ tmid: 'tmid-1', onThreadMessagesLoaded });

		expect(mockLoadThreadMessages).toHaveBeenCalledWith({ tmid: 'tmid-1', rid: 'rid-1' });
		expect(mockGetMessages).not.toHaveBeenCalled();
		expect(onThreadMessagesLoaded).toHaveBeenCalledTimes(1);
		expect(store.getState().loading).toBe(false);
	});

	it('early-returns without fetching messages when the room is an invite subscription', async () => {
		setupObserve();
		mockIsInviteSubscription.mockReturnValue(true);
		const store = getOrCreateRoomStore({ rid: 'rid-1', t: 'c', initialRoom: subRoom });

		await store.getState().init();

		expect(mockGetMessages).not.toHaveBeenCalled();
		expect(store.getState().loading).toBe(false);
	});

	it('fetches the DM member and sets roomUserId on success', async () => {
		setupObserve();
		mockGetUserInfo.mockResolvedValue({ success: true, user: { _id: 'uid-1', username: 'alice' } });
		const dmRoom = { ...subRoom, t: 'd' };
		const store = getOrCreateRoomStore({ rid: 'rid-1', t: 'd', initialRoom: dmRoom });

		await store.getState().init();

		expect(mockGetUserInfo).toHaveBeenCalledWith('uid-1');
		expect(store.getState().member).toEqual({ _id: 'uid-1', username: 'alice' });
		expect(store.getState().roomUserId).toBe('uid-1');
	});

	it('ends loading without scheduling a retry when init throws', async () => {
		jest.useFakeTimers();
		setupObserve();
		mockGetMessages.mockRejectedValueOnce(new Error('boom'));
		const store = getOrCreateRoomStore({ rid: 'rid-1', t: 'c', initialRoom: subRoom });

		await store.getState().init();

		expect(store.getState().loading).toBe(false);
		expect(mockGetMessages).toHaveBeenCalledTimes(1);

		jest.advanceTimersByTime(10000);
		await Promise.resolve();

		expect(mockGetMessages).toHaveBeenCalledTimes(1);
		jest.useRealTimers();
	});

	it('logs the error when init throws', async () => {
		setupObserve();
		const error = new Error('boom');
		mockGetMessages.mockRejectedValueOnce(error);
		const store = getOrCreateRoomStore({ rid: 'rid-1', t: 'c', initialRoom: subRoom });

		await store.getState().init();

		expect(store.getState().loading).toBe(false);
		expect(mockLog).toHaveBeenCalledWith(error);
	});

	it('resolves without throwing or changing loading when init runs on a rid-less store', async () => {
		const store = getOrCreateRoomStore({ initialRoom: stubRoom });

		await expect(store.getState().init()).resolves.toBeUndefined();

		expect(store.getState().loading).toBe(true);
	});

	it('join() sets joined true', () => {
		const { emit } = setupObserve();
		const store = getOrCreateRoomStore({ rid: 'rid-1', t: 'c', initialRoom: stubRoom });

		emit([]);
		expect(store.getState().joined).toBe(false);

		store.getState().join();

		expect(store.getState().joined).toBe(true);
	});

	it('markMessageSent() sets lastOpen null', () => {
		setupObserve();
		const store = getOrCreateRoomStore({ rid: 'rid-1', initialRoom: stubRoom });
		store.setState({ lastOpen: new Date() });

		store.getState().markMessageSent();

		expect(store.getState().lastOpen).toBeNull();
	});

	it('roomAttrsUpdateColumns has exactly one entry per roomAttrsUpdate key', () => {
		expect(Object.keys(roomAttrsUpdateColumns).sort()).toEqual([...roomAttrsUpdate].sort());
	});

	describe('registry', () => {
		it('returns the same store for the same rid and starts observation only once', () => {
			const { observeWithColumns } = setupObserve();

			const first = getOrCreateRoomStore({ rid: 'rid-1', initialRoom: stubRoom });
			const second = getOrCreateRoomStore({ rid: 'rid-1', initialRoom: stubRoom });

			expect(second).toBe(first);
			expect(observeWithColumns).toHaveBeenCalledTimes(1);
		});

		it('unsubscribes only when the last release brings the refcount to zero', () => {
			const { unsubscribe } = setupObserve();

			getOrCreateRoomStore({ rid: 'rid-1', initialRoom: stubRoom });
			getOrCreateRoomStore({ rid: 'rid-1', initialRoom: stubRoom });

			releaseRoomStore('rid-1');
			expect(unsubscribe).not.toHaveBeenCalled();

			releaseRoomStore('rid-1');
			expect(unsubscribe).toHaveBeenCalledTimes(1);
		});

		it('creates a fresh store after the previous one was fully released', () => {
			const { observeWithColumns } = setupObserve();

			const first = getOrCreateRoomStore({ rid: 'rid-1', initialRoom: stubRoom });
			releaseRoomStore('rid-1');
			const second = getOrCreateRoomStore({ rid: 'rid-1', initialRoom: stubRoom });

			expect(second).not.toBe(first);
			expect(observeWithColumns).toHaveBeenCalledTimes(2);
		});

		it('never shares state across rid-less stores and leaves release a no-op', () => {
			const first = getOrCreateRoomStore({ initialRoom: stubRoom });
			const second = getOrCreateRoomStore({ initialRoom: stubRoom });

			expect(second).not.toBe(first);
			expect(() => releaseRoomStore(undefined)).not.toThrow();
		});
	});
});
