import database from '../../../../lib/database';
import { loadThreadMessages } from '../../../../lib/methods/loadThreadMessages';
import { readMessages } from '../../../../lib/methods/readMessages';
import { getUserInfo } from '../../../../lib/services/restApi';
import { isGroupChat } from '../../../../lib/methods/helpers';
import { isInviteSubscription } from '../../../../lib/methods/isInviteSubscription';
import log from '../../../../lib/methods/helpers/log';
import getMessages from '../../services/getMessages';
import { createObservableQuery, createObservableRecord } from '../../testUtils/observableDatabase';
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
const subRoom = { id: 'rid-1', rid: 'rid-1', t: 'c', name: 'general' };

const flush = () => Promise.resolve().then(() => Promise.resolve());

const setupPresentRow = (row: Record<string, unknown> = subRoom) => {
	const { record, emit, complete, unsubscribe } = createObservableRecord(row);
	const find = jest.fn(() => Promise.resolve(record));
	mockGet.mockReturnValue({ find });
	return { record, emit, destroy: complete, unsubscribe, find };
};

const setupAbsentThenPresentRow = (findError: Error = new Error('Record subscriptions#rid-1 not found')) => {
	const find = jest.fn(() => Promise.reject(findError));
	const { query, emit, complete, unsubscribe } = createObservableQuery<unknown>();
	mockGet.mockReturnValue({ find, query: jest.fn(() => query) });
	return {
		find,
		queryUnsubscribe: unsubscribe,
		emitRows: emit,
		completeQuery: complete
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
		setupPresentRow();
		const store = createRoomStore({ rid: 'rid-1', initialRoom: stubRoom });

		expect(store.getState().room).toBe(stubRoom);
		expect(store.getState().membership).toBe('preview');
		expect(store.getState().member).toEqual({});
	});

	it('publishes the found record and keeps observing it, with no early return on repeated emissions', async () => {
		const { record, emit } = setupPresentRow();
		const store = createRoomStore({ rid: 'rid-1', initialRoom: stubRoom });
		observeRoom('rid-1', store);
		await flush();

		expect(store.getState().room).toBe(record);
		expect(store.getState().membership).toBe('subscribed');

		emit({ topic: 'new' });
		expect(store.getState().room).toBe(record);
		expect(store.getState().room).toMatchObject({ topic: 'new' });
	});

	it('sets membership to preview for a non-DM room when the record is destroyed', async () => {
		const { emit, destroy } = setupPresentRow();
		const store = createRoomStore({ rid: 'rid-1', initialRoom: stubRoom });
		observeRoom('rid-1', store);
		await flush();

		emit(subRoom);
		expect(store.getState().membership).toBe('subscribed');

		destroy();
		expect(store.getState().membership).toBe('preview');
	});

	it('leaves a DM room untouched when its record is destroyed', async () => {
		const dmRow = { ...subRoom, t: 'd' };
		const { record, emit, destroy } = setupPresentRow(dmRow);
		const store = createRoomStore({ rid: 'rid-1', initialRoom: { ...stubRoom, t: 'd' } });
		observeRoom('rid-1', store);
		await flush();

		emit(dmRow);
		expect(store.getState().membership).toBe('subscribed');

		destroy();
		expect(store.getState().membership).toBe('subscribed');
		expect(store.getState().room).toBe(record);
	});

	it('sets membership to preview for a non-DM room whose subscription is not yet found', async () => {
		setupAbsentThenPresentRow();
		const store = createRoomStore({ rid: 'rid-1', initialRoom: stubRoom });
		observeRoom('rid-1', store);
		await flush();

		expect(store.getState().membership).toBe('preview');
	});

	it('leaves a DM room subscribed while its subscription is not yet found', async () => {
		setupAbsentThenPresentRow();
		const store = createRoomStore({ rid: 'rid-1', initialRoom: { ...stubRoom, t: 'd' } });
		observeRoom('rid-1', store);
		await flush();

		expect(store.getState().membership).toBe('subscribed');
	});

	it('switches from the query observable to the record observable once a row appears, and unsubscribes the query', async () => {
		const { emitRows, queryUnsubscribe } = setupAbsentThenPresentRow();
		const store = createRoomStore({ rid: 'rid-1', initialRoom: stubRoom });
		observeRoom('rid-1', store);
		await flush();

		const { record, emit } = createObservableRecord(subRoom);
		emitRows([record]);

		expect(queryUnsubscribe).toHaveBeenCalledTimes(1);
		expect(store.getState().room).toBe(record);
		expect(store.getState().membership).toBe('subscribed');

		emit({ name: 'renamed' });
		expect(store.getState().room).toBe(record);
		expect(store.getState().room).toMatchObject({ name: 'renamed' });
	});

	it('does not throw when the query emits the same row twice in a row and only observes it once', async () => {
		const { emitRows, queryUnsubscribe } = setupAbsentThenPresentRow();
		const store = createRoomStore({ rid: 'rid-1', initialRoom: stubRoom });
		expect(() => observeRoom('rid-1', store)).not.toThrow();
		await flush();

		const { record } = createObservableRecord(subRoom);
		emitRows([record]);
		emitRows([record]);

		expect(queryUnsubscribe).toHaveBeenCalledTimes(1);
		expect(store.getState().room).toBe(record);
		expect(record.observe).toHaveBeenCalledTimes(1);
	});

	it('cleans up the query while waiting and ignores records arriving after teardown', async () => {
		const { emitRows, queryUnsubscribe } = setupAbsentThenPresentRow();
		const store = createRoomStore({ rid: 'rid-1', initialRoom: stubRoom });
		const cleanup = observeRoom('rid-1', store);
		await flush();
		emitRows([]);
		cleanup();
		const { record } = createObservableRecord(subRoom);
		emitRows([record]);
		expect(queryUnsubscribe).toHaveBeenCalledTimes(1);
		expect(record.observe).not.toHaveBeenCalled();
	});

	it('cleans up the attached record without changing membership', async () => {
		const { emitRows, queryUnsubscribe } = setupAbsentThenPresentRow();
		const store = createRoomStore({ rid: 'rid-1', initialRoom: stubRoom });
		const cleanup = observeRoom('rid-1', store);
		await flush();
		const { record, unsubscribe, emit, complete } = createObservableRecord(subRoom);
		emitRows([record]);
		cleanup();
		emit({ ...subRoom, name: 'ignored' });
		complete();
		expect(queryUnsubscribe).toHaveBeenCalledTimes(1);
		expect(unsubscribe).toHaveBeenCalledTimes(1);
		expect(store.getState().room).toBe(record);
		expect(store.getState().membership).toBe('subscribed');
	});

	it.each(['c', 'd'])('preserves record completion after query handoff for room type %s', async t => {
		const { emitRows } = setupAbsentThenPresentRow();
		const store = createRoomStore({ rid: 'rid-1', initialRoom: { ...stubRoom, t } });
		observeRoom('rid-1', store);
		await flush();
		const { record, complete } = createObservableRecord({ ...subRoom, t });
		emitRows([record]);
		expect(store.getState().membership).toBe('subscribed');
		complete();
		expect(store.getState().membership).toBe(t === 'd' ? 'subscribed' : 'preview');
	});

	it('does not treat query completion without a record as record deletion', async () => {
		const { completeQuery } = setupAbsentThenPresentRow();
		const store = createRoomStore({ rid: 'rid-1', initialRoom: stubRoom });
		observeRoom('rid-1', store);
		await flush();
		store.getState().join();
		completeQuery();
		expect(store.getState().membership).toBe('subscribed');
	});

	it('runs the main init path: fetches messages and sets member and canAutoTranslate', async () => {
		setupPresentRow();
		const store = createRoomStore({ rid: 'rid-1', initialRoom: subRoom });

		await store.getState().init();

		expect(mockGetMessages).toHaveBeenCalledWith(expect.objectContaining({ rid: 'rid-1', t: 'c' }));
		expect(store.getState().member).toEqual({});
		expect(store.getState().canAutoTranslate).toBe(true);
	});

	it('loads messages without a read receipt for a route-param room that lacks a subscription row', async () => {
		setupPresentRow();
		const store = createRoomStore({ rid: 'rid-1', initialRoom: stubRoom });

		await store.getState().init();

		expect(mockGetMessages).toHaveBeenCalledWith({ rid: 'rid-1', t: 'c' });
		expect(mockReadMessages).not.toHaveBeenCalled();
	});

	it('routes a cursor-less subscribed room to the room-history loader directly', async () => {
		setupPresentRow();
		const store = createRoomStore({ rid: 'rid-1', initialRoom: subRoom });

		await store.getState().init();

		expect(mockGetMessages).toHaveBeenCalledTimes(1);
		expect(mockGetMessages).toHaveBeenCalledWith({ rid: 'rid-1', t: 'c' });
		expect(mockReadMessages).toHaveBeenCalledWith('rid-1');
	});

	it('routes a subscribed room with a cursor to the missed-messages loader', async () => {
		setupPresentRow();
		const roomWithCursor = { ...subRoom, lastOpen: new Date('2026-01-01T00:00:00.000Z') };
		const store = createRoomStore({ rid: 'rid-1', initialRoom: roomWithCursor });

		await store.getState().init();

		expect(mockGetMessages).toHaveBeenCalledTimes(1);
		expect(mockGetMessages).toHaveBeenCalledWith({ rid: 'rid-1' });
	});

	it('runs the thread init path when tmid is set: loads thread messages and fires the callback', async () => {
		setupPresentRow();
		const onThreadMessagesLoaded = jest.fn();
		const store = createRoomStore({ rid: 'rid-1', initialRoom: subRoom });

		await store.getState().init({ tmid: 'tmid-1', onThreadMessagesLoaded });

		expect(mockLoadThreadMessages).toHaveBeenCalledWith({ tmid: 'tmid-1', rid: 'rid-1' });
		expect(mockGetMessages).not.toHaveBeenCalled();
		expect(onThreadMessagesLoaded).toHaveBeenCalledTimes(1);
	});

	it('early-returns without fetching messages when the room is an invite subscription', async () => {
		setupPresentRow();
		mockIsInviteSubscription.mockReturnValue(true);
		const store = createRoomStore({ rid: 'rid-1', initialRoom: subRoom });

		await expect(store.getState().init()).resolves.toEqual({ status: 'skipped' });

		expect(mockGetMessages).not.toHaveBeenCalled();
	});

	it('fetches the DM member and sets roomUserId on success', async () => {
		setupPresentRow();
		mockGetUserInfo.mockResolvedValue({ success: true, user: { _id: 'uid-1', username: 'alice' } });
		const dmRoom = { ...subRoom, t: 'd' };
		const store = createRoomStore({ rid: 'rid-1', initialRoom: dmRoom });

		await store.getState().init();

		expect(mockGetUserInfo).toHaveBeenCalledWith('uid-1');
		expect(store.getState().member).toEqual({ _id: 'uid-1', username: 'alice' });
		expect(store.getState().roomUserId).toBe('uid-1');
	});

	it('leaves roomUserId untouched until getUserInfo resolves', async () => {
		setupPresentRow();
		let resolveUserInfo: (value: unknown) => void = () => {};
		mockGetUserInfo.mockReturnValue(
			new Promise(resolve => {
				resolveUserInfo = resolve;
			})
		);
		const dmRoom = { ...subRoom, t: 'd' };
		const store = createRoomStore({ rid: 'rid-1', initialRoom: dmRoom });

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
		setupPresentRow();
		const controller = new AbortController();
		mockGetMessages.mockImplementation(() => {
			controller.abort();
			return Promise.resolve();
		});
		const store = createRoomStore({ rid: 'rid-1', initialRoom: subRoom });

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
			setupPresentRow();
			const error = new Error('boom');
			mockGetMessages.mockRejectedValueOnce(error);
			const store = createRoomStore({ rid: 'rid-1', initialRoom: subRoom });

			const initPromise = store.getState().init();
			await jest.advanceTimersByTimeAsync(1000);
			await initPromise;

			expect(mockLog).toHaveBeenCalledWith(error);
		});

		it('retries after a failed attempt and resolves with the lastSeen of the successful one', async () => {
			setupPresentRow();
			const unreadRoom = { ...subRoom, alert: true, ls: new Date('2026-01-01T00:00:00.000Z') };
			mockGetMessages.mockRejectedValueOnce(new Error('boom'));
			const store = createRoomStore({ rid: 'rid-1', initialRoom: unreadRoom });

			const initPromise = store.getState().init();
			await jest.advanceTimersByTimeAsync(1000);

			await expect(initPromise).resolves.toEqual({ status: 'loaded', lastSeen: unreadRoom.ls });
			expect(mockGetMessages).toHaveBeenCalledTimes(2);
		});

		it('gives up after three attempts and resolves as failed', async () => {
			setupPresentRow();
			mockGetMessages.mockRejectedValue(new Error('boom'));
			const store = createRoomStore({ rid: 'rid-1', initialRoom: subRoom });

			const initPromise = store.getState().init();
			await jest.advanceTimersByTimeAsync(10000);

			await expect(initPromise).resolves.toEqual({ status: 'failed' });
			expect(mockGetMessages).toHaveBeenCalledTimes(3);
		});

		it('retries against the room the observer delivered after the first attempt failed on an empty store', async () => {
			const { emit } = setupPresentRow();
			mockGetMessages.mockRejectedValueOnce(new Error('boom'));
			const store = createRoomStore({ rid: 'rid-1', initialRoom: { rid: '', t: '' } });
			observeRoom('rid-1', store);
			await flush();

			const initPromise = store.getState().init();
			await jest.advanceTimersByTimeAsync(0);
			emit(subRoom);
			await jest.advanceTimersByTimeAsync(10000);

			await expect(initPromise).resolves.toEqual({ status: 'loaded', lastSeen: null });
			expect(mockGetMessages).toHaveBeenCalledTimes(2);
			// The retry used the room the observer delivered, not the empty snapshot init started with.
			expect(mockGetMessages).toHaveBeenLastCalledWith({ rid: 'rid-1', t: 'c' });
		});

		it('anchors the unread divider on the room read at the retry, not the one the run started with', async () => {
			const { emit } = setupPresentRow();
			const unreadRoom = { ...subRoom, alert: true, ls: new Date('2026-02-02T00:00:00.000Z') };
			mockGetMessages.mockRejectedValueOnce(new Error('boom'));
			const store = createRoomStore({ rid: 'rid-1', initialRoom: subRoom });
			observeRoom('rid-1', store);
			await flush();

			const initPromise = store.getState().init();
			await jest.advanceTimersByTimeAsync(0);
			emit(unreadRoom);
			await jest.advanceTimersByTimeAsync(10000);

			await expect(initPromise).resolves.toEqual({ status: 'loaded', lastSeen: unreadRoom.ls });
		});

		it('does not retry an invite subscription', async () => {
			setupPresentRow();
			mockIsInviteSubscription.mockReturnValue(true);
			const store = createRoomStore({ rid: 'rid-1', initialRoom: subRoom });

			const initPromise = store.getState().init();
			await jest.advanceTimersByTimeAsync(10000);

			await expect(initPromise).resolves.toEqual({ status: 'skipped' });
			expect(mockGetMessages).not.toHaveBeenCalled();
		});

		it('stops retrying and reports skipped once the run signal aborts', async () => {
			setupPresentRow();
			mockGetMessages.mockRejectedValue(new Error('boom'));
			const controller = new AbortController();
			const store = createRoomStore({ rid: 'rid-1', initialRoom: subRoom });

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

	it('join() sets membership to subscribed', async () => {
		setupAbsentThenPresentRow();
		const store = createRoomStore({ rid: 'rid-1', initialRoom: stubRoom });
		observeRoom('rid-1', store);
		await flush();

		expect(store.getState().membership).toBe('preview');

		store.getState().join();

		expect(store.getState().membership).toBe('subscribed');
	});

	it('falls to Preview Mode without logging when the row is not found', async () => {
		setupAbsentThenPresentRow(new Error('Record subscriptions#rid-1 not found'));
		const store = createRoomStore({ rid: 'rid-1', initialRoom: stubRoom });
		observeRoom('rid-1', store);
		await flush();

		expect(store.getState().membership).toBe('preview');
		expect(mockLog).not.toHaveBeenCalled();
	});

	it('falls to Preview Mode and logs any other lookup error', async () => {
		const error = new Error('database unavailable');
		setupAbsentThenPresentRow(error);
		const store = createRoomStore({ rid: 'rid-1', initialRoom: stubRoom });
		observeRoom('rid-1', store);
		await flush();

		expect(store.getState().membership).toBe('preview');
		expect(mockLog).toHaveBeenCalledTimes(1);
		expect(mockLog).toHaveBeenCalledWith(error);
	});

	describe('Room Membership tri-state', () => {
		it('exposes Preview Mode when no subscription row is found', async () => {
			setupAbsentThenPresentRow();
			const store = createRoomStore({ rid: 'rid-1', initialRoom: stubRoom });
			observeRoom('rid-1', store);
			await flush();

			await store.getState().init();

			expect(store.getState().membership).toBe('preview');
		});

		it('exposes Invited membership for an invite subscription row', async () => {
			setupPresentRow();
			mockIsInviteSubscription.mockReturnValue(true);
			const store = createRoomStore({ rid: 'rid-1', initialRoom: stubRoom });
			observeRoom('rid-1', store);
			await flush();

			expect(store.getState().membership).toBe('invited');
		});

		it('exposes Subscribed Room membership for a joined subscription row', async () => {
			setupPresentRow();
			const store = createRoomStore({ rid: 'rid-1', initialRoom: stubRoom });
			observeRoom('rid-1', store);
			await flush();

			expect(store.getState().membership).toBe('subscribed');
		});

		it('lands on Preview Mode when a non-DM record observer completes', async () => {
			const { destroy } = setupPresentRow();
			const store = createRoomStore({ rid: 'rid-1', initialRoom: stubRoom });
			observeRoom('rid-1', store);
			await flush();

			destroy();

			expect(store.getState().membership).toBe('preview');
		});
	});
});
