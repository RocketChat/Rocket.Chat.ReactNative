import database from '../../../../lib/database';
import { loadThreadMessages } from '../../../../lib/methods/loadThreadMessages';
import { readMessages } from '../../../../lib/methods/readMessages';
import { getUserInfo } from '../../../../lib/services/restApi';
import { isGroupChat } from '../../../../lib/methods/helpers';
import { isInviteSubscription } from '../../../../lib/methods/isInviteSubscription';
import log from '../../../../lib/methods/helpers/log';
import { roomAttrsUpdate, roomAttrsUpdateColumns } from '../../constants';
import getMessages from '../../services/getMessages';
import { createRoomStore, observeRoom } from '../RoomStore';

jest.mock('../../../../lib/database', () => ({
	__esModule: true,
	default: { active: { get: jest.fn() } }
}));
jest.mock('../../services/getMessages', () => ({
	__esModule: true,
	default: jest.fn(() => Promise.resolve())
}));
jest.mock('../../../../lib/methods/loadThreadMessages', () => ({
	loadThreadMessages: jest.fn(() => Promise.resolve())
}));
jest.mock('../../../../lib/methods/readMessages', () => ({
	readMessages: jest.fn(() => Promise.resolve())
}));
jest.mock('../../../../lib/services/restApi', () => ({
	getUserInfo: jest.fn()
}));
jest.mock('../../../../lib/methods/helpers', () => ({
	getUidDirectMessage: jest.fn(() => 'uid-1'),
	isGroupChat: jest.fn(() => false),
	canAutoTranslate: jest.fn(() => true)
}));
jest.mock('../../../../lib/methods/isInviteSubscription', () => ({
	isInviteSubscription: jest.fn(() => false)
}));
jest.mock('../../../../lib/methods/helpers/log', () => jest.fn());

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

const createObservedStore = ({ rid = 'rid-1', initialRoom }: { rid?: string; initialRoom: any }) => {
	const store = createRoomStore({ rid, initialRoom });
	observeRoom(rid, store);
	return store;
};

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

	it('exposes the initial room synchronously on creation', () => {
		setupObserve();
		const store = createObservedStore({ initialRoom: stubRoom });

		expect(store.getState().room).toBe(stubRoom);
		expect(store.getState().joined).toBe(true);
		expect(store.getState().subscribed).toBe(false);
		expect(store.getState().member).toEqual({});
	});

	it('flips to preview mode (not subscribed, not joined) when a non-DM has no subscription', () => {
		const { emit } = setupObserve();
		const store = createObservedStore({ initialRoom: stubRoom });

		emit([]);

		expect(store.getState().subscribed).toBe(false);
		expect(store.getState().joined).toBe(false);
		expect(store.getState().room).toBe(stubRoom);
	});

	it('keeps a DM joined even with no subscription yet', () => {
		const { emit } = setupObserve();
		const store = createObservedStore({ initialRoom: { ...stubRoom, t: 'd' } });

		emit([]);

		expect(store.getState().subscribed).toBe(false);
		expect(store.getState().joined).toBe(true);
	});

	it('flips joined back to true once the subscription appears later', () => {
		const { emit } = setupObserve();
		const store = createObservedStore({ initialRoom: stubRoom });

		emit([]);
		expect(store.getState().joined).toBe(false);

		emit([subRoom]);
		expect(store.getState().joined).toBe(true);
		expect(store.getState().subscribed).toBe(true);
	});

	it('rebuilds a fresh roomUpdate snapshot when the same model instance re-emits a mutated column', () => {
		const { emit } = setupObserve();
		const mutable = { ...subRoom, topic: 'old' };
		const store = createObservedStore({ initialRoom: stubRoom });

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
		const store = createObservedStore({ initialRoom: stubRoom });

		emit([mutable]);
		expect(store.getState().lastMessageFromAgent).toBe(false);

		mutable.lastMessage = { u: { _id: 'agent-1' } };
		emit([mutable]);

		expect(store.getState().lastMessageFromAgent).toBe(true);
		expect(store.getState().room).toBe(mutable);
	});

	it('replaces room when the subscription row is recreated with identical attributes', () => {
		const { emit } = setupObserve();
		const store = createObservedStore({ initialRoom: stubRoom });

		emit([subRoom]);
		emit([]);
		const recreated = { ...subRoom, id: 'sub-2' };
		emit([recreated]);

		expect(store.getState().subscribed).toBe(true);
		expect(store.getState().room).toBe(recreated);
	});

	it('derives the agent-authored flag from a Livechat row', () => {
		const { emit } = setupObserve();
		const store = createObservedStore({ initialRoom: stubRoom });

		emit([{ id: 'sub-1', rid: 'rid-1', t: 'l', lastMessage: { u: { _id: 'agent-1' } } }]);

		expect(store.getState().lastMessageFromAgent).toBe(true);
	});

	it('does not update the agent-authored flag for a Channel last Message', () => {
		const { emit } = setupObserve();
		const store = createObservedStore({ initialRoom: stubRoom });

		emit([{ ...subRoom, lastMessage: { u: { _id: 'agent-1' } } }]);

		expect(store.getState().lastMessageFromAgent).toBe(false);
	});

	it('clears the agent-authored flag when the row stops being a Livechat room', () => {
		const { emit } = setupObserve();
		const store = createObservedStore({ initialRoom: stubRoom });

		emit([{ id: 'sub-1', rid: 'rid-1', t: 'l', lastMessage: { u: { _id: 'agent-1' } } }]);
		expect(store.getState().lastMessageFromAgent).toBe(true);

		emit([{ id: 'sub-1', rid: 'rid-1', t: 'c', lastMessage: { u: { _id: 'agent-1' } } }]);

		expect(store.getState().lastMessageFromAgent).toBe(false);
	});

	it('runs the main init path: fetches messages and sets member and canAutoTranslate', async () => {
		setupObserve();
		const store = createObservedStore({ initialRoom: subRoom });

		await store.getState().init();

		expect(mockGetMessages).toHaveBeenCalledWith(expect.objectContaining({ rid: 'rid-1', t: 'c' }));
		expect(store.getState().member).toEqual({});
		expect(store.getState().canAutoTranslate).toBe(true);
	});

	it('loads messages without a read receipt for a route-param room that lacks a subscription row', async () => {
		setupObserve();
		const store = createObservedStore({ initialRoom: stubRoom });

		await store.getState().init();

		expect(mockGetMessages).toHaveBeenCalledWith({ rid: 'rid-1', t: 'c' });
		expect(mockReadMessages).not.toHaveBeenCalled();
	});

	it('routes a cursor-less subscribed room to the room-history loader directly', async () => {
		setupObserve();
		const store = createObservedStore({ initialRoom: subRoom });

		await store.getState().init();

		expect(mockGetMessages).toHaveBeenCalledTimes(1);
		expect(mockGetMessages).toHaveBeenCalledWith({ rid: 'rid-1', t: 'c' });
		expect(mockReadMessages).toHaveBeenCalledWith('rid-1');
	});

	it('routes a subscribed room with a cursor to the missed-messages loader', async () => {
		setupObserve();
		const roomWithCursor = { ...subRoom, lastOpen: new Date('2026-01-01T00:00:00.000Z') };
		const store = createObservedStore({ initialRoom: roomWithCursor });

		await store.getState().init();

		expect(mockGetMessages).toHaveBeenCalledTimes(1);
		expect(mockGetMessages).toHaveBeenCalledWith({ rid: 'rid-1' });
	});

	it('runs the thread init path when tmid is set: loads thread messages and fires the callback', async () => {
		setupObserve();
		const onThreadMessagesLoaded = jest.fn();
		const store = createObservedStore({ initialRoom: subRoom });

		await store.getState().init({ tmid: 'tmid-1', onThreadMessagesLoaded });

		expect(mockLoadThreadMessages).toHaveBeenCalledWith({ tmid: 'tmid-1', rid: 'rid-1' });
		expect(mockGetMessages).not.toHaveBeenCalled();
		expect(onThreadMessagesLoaded).toHaveBeenCalledTimes(1);
	});

	it('early-returns without fetching messages when the room is an invite subscription', async () => {
		setupObserve();
		mockIsInviteSubscription.mockReturnValue(true);
		const store = createObservedStore({ initialRoom: subRoom });

		await expect(store.getState().init()).resolves.toEqual({ status: 'skipped' });

		expect(mockGetMessages).not.toHaveBeenCalled();
	});

	it('fetches the DM member and sets roomUserId on success', async () => {
		setupObserve();
		mockGetUserInfo.mockResolvedValue({ success: true, user: { _id: 'uid-1', username: 'alice' } });
		const dmRoom = { ...subRoom, t: 'd' };
		const store = createObservedStore({ initialRoom: dmRoom });

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
		const store = createObservedStore({ initialRoom: dmRoom });

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
		const store = createObservedStore({ initialRoom: subRoom });

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
			const store = createObservedStore({ initialRoom: subRoom });

			const initPromise = store.getState().init();
			await jest.advanceTimersByTimeAsync(1000);
			await initPromise;

			expect(mockLog).toHaveBeenCalledWith(error);
		});

		it('retries after a failed attempt and resolves with the lastSeen of the successful one', async () => {
			setupObserve();
			const unreadRoom = { ...subRoom, alert: true, ls: new Date('2026-01-01T00:00:00.000Z') };
			mockGetMessages.mockRejectedValueOnce(new Error('boom'));
			const store = createObservedStore({ initialRoom: unreadRoom });

			const initPromise = store.getState().init();
			await jest.advanceTimersByTimeAsync(1000);

			await expect(initPromise).resolves.toEqual({ status: 'loaded', lastSeen: unreadRoom.ls });
			expect(mockGetMessages).toHaveBeenCalledTimes(2);
		});

		it('gives up after three attempts and resolves as failed', async () => {
			setupObserve();
			mockGetMessages.mockRejectedValue(new Error('boom'));
			const store = createObservedStore({ initialRoom: subRoom });

			const initPromise = store.getState().init();
			await jest.advanceTimersByTimeAsync(10000);

			await expect(initPromise).resolves.toEqual({ status: 'failed' });
			expect(mockGetMessages).toHaveBeenCalledTimes(3);
		});

		it('retries against the room the observer delivered after the first attempt failed on an empty store', async () => {
			const { emit } = setupObserve();
			mockGetMessages.mockRejectedValueOnce(new Error('boom'));
			const store = createObservedStore({ initialRoom: { rid: '', t: '' } });

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
			const store = createObservedStore({ initialRoom: subRoom });

			const initPromise = store.getState().init();
			await jest.advanceTimersByTimeAsync(0);
			emit([unreadRoom]);
			await jest.advanceTimersByTimeAsync(10000);

			await expect(initPromise).resolves.toEqual({ status: 'loaded', lastSeen: unreadRoom.ls });
		});

		it('does not retry an invite subscription', async () => {
			setupObserve();
			mockIsInviteSubscription.mockReturnValue(true);
			const store = createObservedStore({ initialRoom: subRoom });

			const initPromise = store.getState().init();
			await jest.advanceTimersByTimeAsync(10000);

			await expect(initPromise).resolves.toEqual({ status: 'skipped' });
			expect(mockGetMessages).not.toHaveBeenCalled();
		});

		it('stops retrying and reports skipped once the run signal aborts', async () => {
			setupObserve();
			mockGetMessages.mockRejectedValue(new Error('boom'));
			const controller = new AbortController();
			const store = createObservedStore({ initialRoom: subRoom });

			const initPromise = store.getState().init({ signal: controller.signal });
			await jest.advanceTimersByTimeAsync(0);
			controller.abort();
			await jest.advanceTimersByTimeAsync(10000);

			await expect(initPromise).resolves.toEqual({ status: 'skipped' });
			expect(mockGetMessages).toHaveBeenCalledTimes(1);
		});
	});

	it('resolves without throwing or fetching messages when init runs on a rid-less store', async () => {
		const store = createRoomStore({ initialRoom: stubRoom });

		await expect(store.getState().init()).resolves.toEqual({ status: 'skipped' });

		expect(mockGetMessages).not.toHaveBeenCalled();
	});

	it('join() sets joined true', () => {
		const { emit } = setupObserve();
		const store = createObservedStore({ initialRoom: stubRoom });

		emit([]);
		expect(store.getState().joined).toBe(false);

		store.getState().join();

		expect(store.getState().joined).toBe(true);
	});

	it('roomAttrsUpdateColumns has exactly one entry per roomAttrsUpdate key', () => {
		expect(Object.keys(roomAttrsUpdateColumns).sort()).toEqual([...roomAttrsUpdate].sort());
	});
});
