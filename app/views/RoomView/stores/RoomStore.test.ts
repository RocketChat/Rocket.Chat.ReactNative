import { StrictMode } from 'react';
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
import { peekOrCreateRoomStore, acquireRoomStore, releaseRoomStore, useRoomStoreByRid, useRoomStoreForScreen } from './RoomStore';

const mockScheduledSweeps: Array<() => void> = [];
const acquire = (rid = 'rid-1') => acquireRoomStore({ rid }, peekOrCreateRoomStore({ rid, initialRoom: stubRoom }));
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

	it('flips to preview mode (not subscribed, not joined) when a non-DM has no subscription', () => {
		const { emit } = setupObserve();
		const store = peekOrCreateRoomStore({ rid: 'rid-1', initialRoom: stubRoom });

		emit([]);

		expect(store.getState().subscribed).toBe(false);
		expect(store.getState().joined).toBe(false);
		expect(store.getState().room).toBe(stubRoom);
	});

	it('keeps a DM joined even with no subscription yet', () => {
		const { emit } = setupObserve();
		const store = peekOrCreateRoomStore({ rid: 'rid-1', initialRoom: { ...stubRoom, t: 'd' } });

		emit([]);

		expect(store.getState().subscribed).toBe(false);
		expect(store.getState().joined).toBe(true);
	});

	it('flips joined back to true once the subscription appears later', () => {
		const { emit } = setupObserve();
		const store = peekOrCreateRoomStore({ rid: 'rid-1', initialRoom: stubRoom });

		emit([]);
		expect(store.getState().joined).toBe(false);

		emit([subRoom]);
		expect(store.getState().joined).toBe(true);
		expect(store.getState().subscribed).toBe(true);
	});

	it('rebuilds a fresh roomUpdate snapshot when the same model instance re-emits a mutated column', () => {
		const { emit } = setupObserve();
		const mutable = { ...subRoom, topic: 'old' };
		const store = peekOrCreateRoomStore({ rid: 'rid-1', initialRoom: stubRoom });

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

	it('keeps room pointing at the live model instance when only lastMessage changes on a Livechat row', () => {
		const { emit } = setupObserve();
		const mutable: Record<string, unknown> = {
			id: 'sub-1',
			rid: 'rid-1',
			t: 'l',
			lastMessage: { u: { _id: 'visitor-1' }, token: 'v' }
		};
		const store = peekOrCreateRoomStore({ rid: 'rid-1', initialRoom: stubRoom });

		emit([mutable]);
		expect(store.getState().lastMessageFromAgent).toBe(false);

		mutable.lastMessage = { u: { _id: 'agent-1' } };
		emit([mutable]);

		expect(store.getState().lastMessageFromAgent).toBe(true);
		expect(store.getState().room).toBe(mutable);
	});

	it('replaces room when the subscription row is recreated with identical attributes', () => {
		const { emit } = setupObserve();
		const store = peekOrCreateRoomStore({ rid: 'rid-1', initialRoom: stubRoom });

		emit([subRoom]);
		emit([]);
		const recreated = { ...subRoom, id: 'sub-2' };
		emit([recreated]);

		expect(store.getState().subscribed).toBe(true);
		expect(store.getState().room).toBe(recreated);
	});

	it('derives the agent-authored flag from a Livechat row', () => {
		const { emit } = setupObserve();
		const store = peekOrCreateRoomStore({ rid: 'rid-1', initialRoom: stubRoom });

		emit([{ id: 'sub-1', rid: 'rid-1', t: 'l', lastMessage: { u: { _id: 'agent-1' } } }]);

		expect(store.getState().lastMessageFromAgent).toBe(true);
	});

	it('does not update the agent-authored flag for a Channel last Message', () => {
		const { emit } = setupObserve();
		const store = peekOrCreateRoomStore({ rid: 'rid-1', initialRoom: stubRoom });

		emit([{ ...subRoom, lastMessage: { u: { _id: 'agent-1' } } }]);

		expect(store.getState().lastMessageFromAgent).toBe(false);
	});

	it('clears the agent-authored flag when the row stops being a Livechat room', () => {
		const { emit } = setupObserve();
		const store = peekOrCreateRoomStore({ rid: 'rid-1', initialRoom: stubRoom });

		emit([{ id: 'sub-1', rid: 'rid-1', t: 'l', lastMessage: { u: { _id: 'agent-1' } } }]);
		expect(store.getState().lastMessageFromAgent).toBe(true);

		emit([{ id: 'sub-1', rid: 'rid-1', t: 'c', lastMessage: { u: { _id: 'agent-1' } } }]);

		expect(store.getState().lastMessageFromAgent).toBe(false);
	});

	it('runs the main init path: fetches messages and sets member and canAutoTranslate', async () => {
		setupObserve();
		const store = peekOrCreateRoomStore({ rid: 'rid-1', initialRoom: subRoom });

		await store.getState().init();

		expect(mockGetMessages).toHaveBeenCalledWith(expect.objectContaining({ rid: 'rid-1', t: 'c' }));
		expect(store.getState().member).toEqual({});
		expect(store.getState().canAutoTranslate).toBe(true);
	});

	it('loads messages without a read receipt for a route-param room that lacks a subscription row', async () => {
		setupObserve();
		const store = peekOrCreateRoomStore({ rid: 'rid-1', initialRoom: stubRoom });

		await store.getState().init();

		expect(mockGetMessages).toHaveBeenCalledWith({ rid: 'rid-1', t: 'c' });
		expect(mockReadMessages).not.toHaveBeenCalled();
	});

	it('routes a cursor-less subscribed room to the room-history loader directly', async () => {
		setupObserve();
		const store = peekOrCreateRoomStore({ rid: 'rid-1', initialRoom: subRoom });

		await store.getState().init();

		expect(mockGetMessages).toHaveBeenCalledTimes(1);
		expect(mockGetMessages).toHaveBeenCalledWith({ rid: 'rid-1', t: 'c' });
		expect(mockReadMessages).toHaveBeenCalledWith('rid-1');
	});

	it('routes a subscribed room with a cursor to the missed-messages loader', async () => {
		setupObserve();
		const roomWithCursor = { ...subRoom, lastOpen: new Date('2026-01-01T00:00:00.000Z') };
		const store = peekOrCreateRoomStore({ rid: 'rid-1', initialRoom: roomWithCursor });

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
		const store = peekOrCreateRoomStore({ rid: 'rid-1', initialRoom: subRoom });

		await expect(store.getState().init()).resolves.toEqual({ status: 'skipped' });

		expect(mockGetMessages).not.toHaveBeenCalled();
	});

	it('fetches the DM member and sets roomUserId on success', async () => {
		setupObserve();
		mockGetUserInfo.mockResolvedValue({ success: true, user: { _id: 'uid-1', username: 'alice' } });
		const dmRoom = { ...subRoom, t: 'd' };
		const store = peekOrCreateRoomStore({ rid: 'rid-1', initialRoom: dmRoom });

		await store.getState().init();

		expect(mockGetUserInfo).toHaveBeenCalledWith('uid-1');
		expect(store.getState().member).toEqual({ _id: 'uid-1', username: 'alice' });
		expect(store.getState().roomUserId).toBe('uid-1');
	});

	it('leaves roomUserId untouched until getUserInfo resolves', async () => {
		setupObserve();
		let resolveUserInfo: (value: unknown) => void = () => {};
		mockGetUserInfo.mockReturnValue(
			new Promise(resolve => {
				resolveUserInfo = resolve;
			})
		);
		const dmRoom = { ...subRoom, t: 'd' };
		const store = peekOrCreateRoomStore({ rid: 'rid-1', initialRoom: dmRoom });

		const initPromise = store.getState().init();
		await Promise.resolve();
		await Promise.resolve();

		expect(mockGetUserInfo).toHaveBeenCalledWith('uid-1');
		expect(store.getState().roomUserId).toBeNull();

		resolveUserInfo({ success: true, user: { _id: 'uid-1', username: 'alice' } });
		await initPromise;

		expect(store.getState().roomUserId).toBe('uid-1');
	});

	it('applies nothing to the store when the run is aborted during a successful attempt', async () => {
		setupObserve();
		const controller = new AbortController();
		mockGetMessages.mockImplementation(() => {
			controller.abort();
			return Promise.resolve();
		});
		const store = peekOrCreateRoomStore({ rid: 'rid-1', initialRoom: subRoom });

		await expect(store.getState().init({ signal: controller.signal })).resolves.toEqual({ status: 'skipped' });

		expect(store.getState().canAutoTranslate).toBe(false);
		expect(mockReadMessages).not.toHaveBeenCalled();
	});

	describe('init retry', () => {
		beforeEach(() => {
			jest.useFakeTimers();
		});

		afterEach(() => {
			jest.useRealTimers();
		});

		it('logs the error when an attempt throws', async () => {
			setupObserve();
			const error = new Error('boom');
			mockGetMessages.mockRejectedValueOnce(error);
			const store = peekOrCreateRoomStore({ rid: 'rid-1', initialRoom: subRoom });

			const initPromise = store.getState().init();
			await jest.advanceTimersByTimeAsync(1000);
			await initPromise;

			expect(mockLog).toHaveBeenCalledWith(error);
		});

		it('retries after a failed attempt and resolves with the lastSeen of the successful one', async () => {
			setupObserve();
			const unreadRoom = { ...subRoom, alert: true, ls: new Date('2026-01-01T00:00:00.000Z') };
			mockGetMessages.mockRejectedValueOnce(new Error('boom'));
			const store = peekOrCreateRoomStore({ rid: 'rid-1', initialRoom: unreadRoom });

			const initPromise = store.getState().init();
			await jest.advanceTimersByTimeAsync(1000);

			await expect(initPromise).resolves.toEqual({ status: 'loaded', lastSeen: unreadRoom.ls });
			expect(mockGetMessages).toHaveBeenCalledTimes(2);
		});

		it('gives up after three attempts and resolves as failed', async () => {
			setupObserve();
			mockGetMessages.mockRejectedValue(new Error('boom'));
			const store = peekOrCreateRoomStore({ rid: 'rid-1', initialRoom: subRoom });

			const initPromise = store.getState().init();
			await jest.advanceTimersByTimeAsync(10000);

			await expect(initPromise).resolves.toEqual({ status: 'failed' });
			expect(mockGetMessages).toHaveBeenCalledTimes(3);
		});

		it('retries against the room the observer delivered after the first attempt failed on an empty store', async () => {
			const { emit } = setupObserve();
			mockGetMessages.mockRejectedValueOnce(new Error('boom'));
			const store = peekOrCreateRoomStore({ rid: 'rid-1', initialRoom: { rid: '', t: '' } });

			const initPromise = store.getState().init();
			await jest.advanceTimersByTimeAsync(0);
			emit([subRoom]);
			await jest.advanceTimersByTimeAsync(10000);

			await expect(initPromise).resolves.toEqual({ status: 'loaded', lastSeen: null });
			expect(mockGetMessages).toHaveBeenCalledTimes(2);
			// The retry used the room the observer delivered, not the empty snapshot init started with.
			expect(mockGetMessages).toHaveBeenLastCalledWith({ rid: 'rid-1', t: 'c' });
		});

		it('anchors the unread divider on the room read at the retry, not the one the run started with', async () => {
			const { emit } = setupObserve();
			const unreadRoom = { ...subRoom, alert: true, ls: new Date('2026-02-02T00:00:00.000Z') };
			mockGetMessages.mockRejectedValueOnce(new Error('boom'));
			const store = peekOrCreateRoomStore({ rid: 'rid-1', initialRoom: subRoom });

			const initPromise = store.getState().init();
			await jest.advanceTimersByTimeAsync(0);
			emit([unreadRoom]);
			await jest.advanceTimersByTimeAsync(10000);

			await expect(initPromise).resolves.toEqual({ status: 'loaded', lastSeen: unreadRoom.ls });
		});

		it('does not retry an invite subscription', async () => {
			setupObserve();
			mockIsInviteSubscription.mockReturnValue(true);
			const store = peekOrCreateRoomStore({ rid: 'rid-1', initialRoom: subRoom });

			const initPromise = store.getState().init();
			await jest.advanceTimersByTimeAsync(10000);

			await expect(initPromise).resolves.toEqual({ status: 'skipped' });
			expect(mockGetMessages).not.toHaveBeenCalled();
		});

		it('stops retrying and reports skipped once the run signal aborts', async () => {
			setupObserve();
			mockGetMessages.mockRejectedValue(new Error('boom'));
			const controller = new AbortController();
			const store = peekOrCreateRoomStore({ rid: 'rid-1', initialRoom: subRoom });

			const initPromise = store.getState().init({ signal: controller.signal });
			await jest.advanceTimersByTimeAsync(0);
			controller.abort();
			await jest.advanceTimersByTimeAsync(10000);

			await expect(initPromise).resolves.toEqual({ status: 'skipped' });
			expect(mockGetMessages).toHaveBeenCalledTimes(1);
		});
	});

	it('resolves without throwing or fetching messages when init runs on a rid-less store', async () => {
		const store = peekOrCreateRoomStore({ initialRoom: stubRoom });

		await expect(store.getState().init()).resolves.toEqual({ status: 'skipped' });

		expect(mockGetMessages).not.toHaveBeenCalled();
	});

	it('join() sets joined true', () => {
		const { emit } = setupObserve();
		const store = peekOrCreateRoomStore({ rid: 'rid-1', initialRoom: stubRoom });

		emit([]);
		expect(store.getState().joined).toBe(false);

		store.getState().join();

		expect(store.getState().joined).toBe(true);
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
			acquire();
			acquire();

			releaseRoomStore('rid-1');
			expect(unsubscribe).not.toHaveBeenCalled();

			releaseRoomStore('rid-1');
			expect(unsubscribe).toHaveBeenCalledTimes(1);
		});

		it('creates a fresh store after the previous one was fully released', () => {
			const { observeWithColumns } = setupObserve();

			const first = peekOrCreateRoomStore({ rid: 'rid-1', initialRoom: stubRoom });
			acquire();
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
		it('reattaches observation when the grace sweep runs before screen acquisition', () => {
			const { observeWithColumns, unsubscribe, emit } = setupObserve();
			jest.spyOn(InteractionManager, 'runAfterInteractions').mockImplementation(((cb: () => void) => {
				cb();
				return { then: () => {} };
			}) as unknown as typeof InteractionManager.runAfterInteractions);

			const { result } = renderHook(() => useRoomStoreForScreen({ rid: 'rid-1', initialRoom: stubRoom }));

			expect(unsubscribe).toHaveBeenCalledTimes(1);
			expect(observeWithColumns).toHaveBeenCalledTimes(2);
			emit([subRoom]);
			expect(result.current.getState().room).toBe(subRoom);
		});

		it('owns the store until the screen transition finishes', () => {
			const { unsubscribe } = setupObserve();
			const { result, unmount } = renderHook(() => useRoomStoreForScreen({ rid: 'rid-1', initialRoom: stubRoom }));

			flushSweeps();
			expect(result.current.getState().room).toBe(stubRoom);
			expect(unsubscribe).not.toHaveBeenCalled();

			unmount();
			expect(unsubscribe).not.toHaveBeenCalled();

			flushSweeps();
			expect(unsubscribe).toHaveBeenCalledTimes(1);
		});

		it('releases every reference under StrictMode so the observer is torn down after unmount', () => {
			const { unsubscribe } = setupObserve();
			const { unmount } = renderHook(() => useRoomStoreForScreen({ rid: 'rid-1', initialRoom: stubRoom }), {
				wrapper: StrictMode
			});

			flushSweeps();
			unmount();
			flushSweeps();

			expect(unsubscribe).toHaveBeenCalledTimes(1);
		});

		it('warm-up then navigate: peek keeps the store alive across the sweep once the mount acquires it', () => {
			const { unsubscribe } = setupObserve();

			// goRoom warms the store at press time (peek, no acquire).
			const warmed = peekOrCreateRoomStore({ rid: 'rid-1', initialRoom: stubRoom });
			// RoomView mounts against the same warmed entry and acquires it before the sweep runs.
			const mounted = peekOrCreateRoomStore({ rid: 'rid-1', initialRoom: stubRoom });
			acquire();

			flushSweeps();

			expect(mounted).toBe(warmed);
			expect(unsubscribe).not.toHaveBeenCalled();
		});

		it('re-registers an owned observer when the grace sweep reclaims an entry before the acquire commits', () => {
			const { unsubscribe, observeWithColumns } = setupObserve();

			// Warm at refCount 0, then let the sweep tear it down before the mount effect acquires.
			const warmed = peekOrCreateRoomStore({ rid: 'rid-1', initialRoom: stubRoom });
			flushSweeps();
			expect(unsubscribe).toHaveBeenCalledTimes(1);

			acquireRoomStore({ rid: 'rid-1' }, warmed);
			flushSweeps();

			expect(observeWithColumns).toHaveBeenCalledTimes(2);
			expect(unsubscribe).toHaveBeenCalledTimes(1);
		});

		it('pop during grace: an entry released to zero before the sweep is torn down immediately, sweep is a no-op', () => {
			const { unsubscribe } = setupObserve();

			peekOrCreateRoomStore({ rid: 'rid-1', initialRoom: stubRoom });
			acquire();
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
