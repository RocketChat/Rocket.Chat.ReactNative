import { InteractionManager } from 'react-native';
import { renderHook } from '@testing-library/react-native';

import database from '../../../lib/database';
import { loadThreadMessages } from '../../../lib/methods/loadThreadMessages';
import { readMessages } from '../../../lib/methods/readMessages';
import { getUserInfo } from '../../../lib/services/restApi';
import { isGroupChat } from '../../../lib/methods/helpers';
import { isInviteSubscription } from '../../../lib/methods/isInviteSubscription';
import log from '../../../lib/methods/helpers/log';
import { roomAttrsUpdate, roomAttrsUpdateColumns } from '../constants';
import getMessages from '../services/getMessages';
import { peekOrCreateRoomStore, acquireRoomStore, releaseRoomStore, useRoomStoreByRid } from './RoomStore';

const mockScheduledSweeps: Array<() => void> = [];
const flushSweeps = () => {
	const pending = mockScheduledSweeps.splice(0);
	pending.forEach(cb => cb());
};

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
const mockReadMessages = readMessages as jest.Mock;
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
		mockScheduledSweeps.length = 0;
		jest.spyOn(InteractionManager, 'runAfterInteractions').mockImplementation(((cb: () => void) => {
			mockScheduledSweeps.push(cb);
			return { then: () => {} };
		}) as unknown as typeof InteractionManager.runAfterInteractions);
		mockIsGroupChat.mockReturnValue(false);
		mockIsInviteSubscription.mockReturnValue(false);
		mockGetMessages.mockResolvedValue(undefined);
		mockLoadThreadMessages.mockResolvedValue(undefined);
	});

	// Isolate cases through the public release API instead of a test-only registry reset. peekOrCreate
	// leaves entries at refCount 0, so a release drives them below zero and tears them down; flushing
	// any queued grace sweep clears the pending-callback list between cases.
	afterEach(() => {
		releaseRoomStore('rid-1');
		releaseRoomStore('rid-1');
		flushSweeps();
	});

	it('exposes the initial room synchronously on creation', () => {
		setupObserve();
		const store = peekOrCreateRoomStore({ rid: 'rid-1', initialRoom: stubRoom });

		expect(store.getState().room).toBe(stubRoom);
		expect(store.getState().joined).toBe(true);
		expect(store.getState().subscribed).toBe(false);
		expect(store.getState().member).toEqual({});
	});

	it('marks subscribed and joined when the subscription observable emits a row', () => {
		const { emit } = setupObserve();
		const store = peekOrCreateRoomStore({ rid: 'rid-1', t: 'c', initialRoom: stubRoom });

		emit([subRoom]);

		expect(store.getState().room).toBe(subRoom);
		expect(store.getState().subscribed).toBe(true);
		expect(store.getState().joined).toBe(true);
	});

	it('flips to preview mode (not subscribed, not joined) when a non-DM has no subscription', () => {
		const { emit } = setupObserve();
		const store = peekOrCreateRoomStore({ rid: 'rid-1', t: 'c', initialRoom: stubRoom });

		emit([]);

		expect(store.getState().subscribed).toBe(false);
		expect(store.getState().joined).toBe(false);
		expect(store.getState().room).toBe(stubRoom);
	});

	it('keeps a DM joined even with no subscription yet', () => {
		const { emit } = setupObserve();
		const store = peekOrCreateRoomStore({ rid: 'rid-1', t: 'd', initialRoom: stubRoom });

		emit([]);

		expect(store.getState().subscribed).toBe(false);
		expect(store.getState().joined).toBe(true);
	});

	it('flips joined back to true once the subscription appears later', () => {
		const { emit } = setupObserve();
		const store = peekOrCreateRoomStore({ rid: 'rid-1', t: 'c', initialRoom: stubRoom });

		emit([]);
		expect(store.getState().joined).toBe(false);

		emit([subRoom]);
		expect(store.getState().joined).toBe(true);
		expect(store.getState().subscribed).toBe(true);
	});

	it('rebuilds a fresh roomUpdate snapshot when the same model instance re-emits a mutated column', () => {
		const { emit } = setupObserve();
		const mutable = { ...subRoom, topic: 'old' };
		const store = peekOrCreateRoomStore({ rid: 'rid-1', t: 'c', initialRoom: stubRoom });

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
		peekOrCreateRoomStore({ rid: 'rid-1', initialRoom: stubRoom });

		expect(observeWithColumns).toHaveBeenCalledWith(Object.values(roomAttrsUpdateColumns));
	});

	it('runs the main init path: fetches messages and sets member and canAutoTranslate', async () => {
		setupObserve();
		const store = peekOrCreateRoomStore({ rid: 'rid-1', t: 'c', initialRoom: subRoom });

		await store.getState().init();

		expect(mockGetMessages).toHaveBeenCalledWith(expect.objectContaining({ rid: 'rid-1', t: 'c' }));
		expect(store.getState().member).toEqual({});
		expect(store.getState().canAutoTranslate).toBe(true);
	});

	it('loads messages without a read receipt for a route-param room that lacks a subscription row', async () => {
		setupObserve();
		const store = peekOrCreateRoomStore({ rid: 'rid-1', t: 'c', initialRoom: stubRoom });

		await store.getState().init();

		expect(mockGetMessages).toHaveBeenCalledWith({ rid: 'rid-1', t: 'c' });
		expect(mockReadMessages).not.toHaveBeenCalled();
	});

	it('routes a cursor-less subscribed room to the room-history loader directly', async () => {
		setupObserve();
		const store = peekOrCreateRoomStore({ rid: 'rid-1', t: 'c', initialRoom: subRoom });

		await store.getState().init();

		expect(mockGetMessages).toHaveBeenCalledTimes(1);
		expect(mockGetMessages).toHaveBeenCalledWith({ rid: 'rid-1', t: 'c' });
		expect(mockReadMessages).toHaveBeenCalledWith('rid-1');
	});

	it('routes a subscribed room with a cursor to the missed-messages loader', async () => {
		setupObserve();
		const roomWithCursor = { ...subRoom, lastOpen: new Date('2026-01-01T00:00:00.000Z') };
		const store = peekOrCreateRoomStore({ rid: 'rid-1', t: 'c', initialRoom: roomWithCursor });

		await store.getState().init();

		expect(mockGetMessages).toHaveBeenCalledTimes(1);
		expect(mockGetMessages).toHaveBeenCalledWith({ rid: 'rid-1' });
	});

	it('runs the thread init path when tmid is set: loads thread messages and fires the callback', async () => {
		setupObserve();
		const onThreadMessagesLoaded = jest.fn();
		const store = peekOrCreateRoomStore({ rid: 'rid-1', initialRoom: subRoom });

		await store.getState().init({ tmid: 'tmid-1', onThreadMessagesLoaded });

		expect(mockLoadThreadMessages).toHaveBeenCalledWith({ tmid: 'tmid-1', rid: 'rid-1' });
		expect(mockGetMessages).not.toHaveBeenCalled();
		expect(onThreadMessagesLoaded).toHaveBeenCalledTimes(1);
	});

	it('early-returns without fetching messages when the room is an invite subscription', async () => {
		setupObserve();
		mockIsInviteSubscription.mockReturnValue(true);
		const store = peekOrCreateRoomStore({ rid: 'rid-1', t: 'c', initialRoom: subRoom });

		await store.getState().init();

		expect(mockGetMessages).not.toHaveBeenCalled();
	});

	it('fetches the DM member and sets roomUserId on success', async () => {
		setupObserve();
		mockGetUserInfo.mockResolvedValue({ success: true, user: { _id: 'uid-1', username: 'alice' } });
		const dmRoom = { ...subRoom, t: 'd' };
		const store = peekOrCreateRoomStore({ rid: 'rid-1', t: 'd', initialRoom: dmRoom });

		await store.getState().init();

		expect(mockGetUserInfo).toHaveBeenCalledWith('uid-1');
		expect(store.getState().member).toEqual({ _id: 'uid-1', username: 'alice' });
		expect(store.getState().roomUserId).toBe('uid-1');
	});

	it('does not schedule a retry when init throws', async () => {
		jest.useFakeTimers();
		setupObserve();
		mockGetMessages.mockRejectedValueOnce(new Error('boom'));
		const store = peekOrCreateRoomStore({ rid: 'rid-1', t: 'c', initialRoom: subRoom });

		await store.getState().init();

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
		const store = peekOrCreateRoomStore({ rid: 'rid-1', t: 'c', initialRoom: subRoom });

		await store.getState().init();

		expect(mockLog).toHaveBeenCalledWith(error);
	});

	it('resolves without throwing or fetching messages when init runs on a rid-less store', async () => {
		const store = peekOrCreateRoomStore({ initialRoom: stubRoom });

		await expect(store.getState().init()).resolves.toBeUndefined();

		expect(mockGetMessages).not.toHaveBeenCalled();
	});

	it('join() sets joined true', () => {
		const { emit } = setupObserve();
		const store = peekOrCreateRoomStore({ rid: 'rid-1', t: 'c', initialRoom: stubRoom });

		emit([]);
		expect(store.getState().joined).toBe(false);

		store.getState().join();

		expect(store.getState().joined).toBe(true);
	});

	it('markMessageSent() sets lastSeen null', () => {
		setupObserve();
		const store = peekOrCreateRoomStore({ rid: 'rid-1', initialRoom: stubRoom });
		store.setState({ lastSeen: new Date() });

		store.getState().markMessageSent();

		expect(store.getState().lastSeen).toBeNull();
	});

	it('roomAttrsUpdateColumns has exactly one entry per roomAttrsUpdate key', () => {
		expect(Object.keys(roomAttrsUpdateColumns).sort()).toEqual([...roomAttrsUpdate].sort());
	});

	describe('registry', () => {
		it('returns the same store for the same rid and starts observation only once', () => {
			const { observeWithColumns } = setupObserve();

			const first = peekOrCreateRoomStore({ rid: 'rid-1', initialRoom: stubRoom });
			const second = peekOrCreateRoomStore({ rid: 'rid-1', initialRoom: stubRoom });

			expect(second).toBe(first);
			expect(observeWithColumns).toHaveBeenCalledTimes(1);
		});

		it('unsubscribes only when the last release brings the refcount to zero', () => {
			const { unsubscribe } = setupObserve();

			peekOrCreateRoomStore({ rid: 'rid-1', initialRoom: stubRoom });
			acquireRoomStore('rid-1');
			acquireRoomStore('rid-1');

			releaseRoomStore('rid-1');
			expect(unsubscribe).not.toHaveBeenCalled();

			releaseRoomStore('rid-1');
			expect(unsubscribe).toHaveBeenCalledTimes(1);
		});

		it('creates a fresh store after the previous one was fully released', () => {
			const { observeWithColumns } = setupObserve();

			const first = peekOrCreateRoomStore({ rid: 'rid-1', initialRoom: stubRoom });
			acquireRoomStore('rid-1');
			releaseRoomStore('rid-1');
			const second = peekOrCreateRoomStore({ rid: 'rid-1', initialRoom: stubRoom });

			expect(second).not.toBe(first);
			expect(observeWithColumns).toHaveBeenCalledTimes(2);
		});

		it('never shares state across rid-less stores and leaves release a no-op', () => {
			const first = peekOrCreateRoomStore({ initialRoom: stubRoom });
			const second = peekOrCreateRoomStore({ initialRoom: stubRoom });

			expect(second).not.toBe(first);
			expect(() => releaseRoomStore(undefined)).not.toThrow();
		});
	});

	describe('refcount lifecycle', () => {
		it('survives a StrictMode double-invoke of the render initializer (peek twice, acquire/release once)', () => {
			const { observeWithColumns, unsubscribe } = setupObserve();

			// StrictMode invokes the useState initializer twice; both peeks must reuse one entry.
			const first = peekOrCreateRoomStore({ rid: 'rid-1', initialRoom: stubRoom });
			const second = peekOrCreateRoomStore({ rid: 'rid-1', initialRoom: stubRoom });
			expect(second).toBe(first);
			expect(observeWithColumns).toHaveBeenCalledTimes(1);

			// The committed mount effect acquires once; its cleanup releases once.
			acquireRoomStore('rid-1');
			flushSweeps();
			expect(unsubscribe).not.toHaveBeenCalled();

			releaseRoomStore('rid-1');
			expect(unsubscribe).toHaveBeenCalledTimes(1);
		});

		it('warm-up then navigate: peek keeps the store alive across the sweep once the mount acquires it', () => {
			const { unsubscribe } = setupObserve();

			// goRoom warms the store at press time (peek, no acquire).
			const warmed = peekOrCreateRoomStore({ rid: 'rid-1', initialRoom: stubRoom });
			// RoomView mounts against the same warmed entry and acquires it before the sweep runs.
			const mounted = peekOrCreateRoomStore({ rid: 'rid-1', initialRoom: stubRoom });
			acquireRoomStore('rid-1');

			flushSweeps();

			expect(mounted).toBe(warmed);
			expect(unsubscribe).not.toHaveBeenCalled();
		});

		it('warns when the grace sweep reclaims an entry before the acquire commits', () => {
			setupObserve();
			const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

			// Warm at refCount 0, then let the sweep tear it down before the mount effect acquires.
			peekOrCreateRoomStore({ rid: 'rid-1', initialRoom: stubRoom });
			flushSweeps();
			acquireRoomStore('rid-1');

			expect(warn).toHaveBeenCalledWith(expect.stringContaining('swept before acquire'));
			warn.mockRestore();
		});

		it('warm-up abandoned: the grace sweep tears down an entry no mount ever acquired', () => {
			const { unsubscribe } = setupObserve();

			peekOrCreateRoomStore({ rid: 'rid-1', initialRoom: stubRoom });

			flushSweeps();

			expect(unsubscribe).toHaveBeenCalledTimes(1);
			// A fresh peek after the sweep starts a brand-new observation.
			const { observeWithColumns } = setupObserve();
			peekOrCreateRoomStore({ rid: 'rid-1', initialRoom: stubRoom });
			expect(observeWithColumns).toHaveBeenCalledTimes(1);
		});

		it('pop during grace: an entry released to zero before the sweep is torn down immediately, sweep is a no-op', () => {
			const { unsubscribe } = setupObserve();

			peekOrCreateRoomStore({ rid: 'rid-1', initialRoom: stubRoom });
			acquireRoomStore('rid-1');
			releaseRoomStore('rid-1');
			expect(unsubscribe).toHaveBeenCalledTimes(1);

			// The still-pending sweep must not double-unsubscribe a deleted entry.
			expect(() => flushSweeps()).not.toThrow();
			expect(unsubscribe).toHaveBeenCalledTimes(1);
		});

		it('schedules at most one grace sweep per entry (idempotent across repeated peeks)', () => {
			const { unsubscribe } = setupObserve();

			peekOrCreateRoomStore({ rid: 'rid-1', initialRoom: stubRoom });
			peekOrCreateRoomStore({ rid: 'rid-1', initialRoom: stubRoom });
			peekOrCreateRoomStore({ rid: 'rid-1', initialRoom: stubRoom });

			expect(mockScheduledSweeps).toHaveLength(1);

			flushSweeps();
			expect(unsubscribe).toHaveBeenCalledTimes(1);
		});
	});

	describe('useRoomStoreByRid', () => {
		it('reads the rid-keyed store from the registry without warning on a hit', () => {
			setupObserve();
			peekOrCreateRoomStore({ rid: 'rid-1', initialRoom: subRoom });
			const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

			const { result } = renderHook(() => useRoomStoreByRid('rid-1', s => s.room));

			expect(result.current).toBe(subRoom);
			expect(warn).not.toHaveBeenCalled();
			warn.mockRestore();
		});

		it('falls back to a createRoomState-derived empty room and warns when the registry misses a set rid', () => {
			const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

			const { result } = renderHook(() => useRoomStoreByRid('missing-rid', s => s.room));

			expect(result.current).toEqual({ rid: '', t: '' });
			expect(warn).toHaveBeenCalledWith(expect.stringContaining('missing-rid'));
			warn.mockRestore();
		});

		it('does not warn when rid is undefined', () => {
			const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

			const { result } = renderHook(() => useRoomStoreByRid(undefined, s => s.room));

			expect(result.current).toEqual({ rid: '', t: '' });
			expect(warn).not.toHaveBeenCalled();
			warn.mockRestore();
		});
	});
});
