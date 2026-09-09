import database from '../../../../lib/database';
import { loadThreadMessages } from '../../../../lib/methods/loadThreadMessages';
import { readMessages } from '../../../../lib/methods/readMessages';
import { getUserInfo } from '../../../../lib/services/restApi';
import { isGroupChat } from '../../../../lib/methods/helpers';
import { isInviteSubscription } from '../../../../lib/methods/isInviteSubscription';
import log from '../../../../lib/methods/helpers/log';
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
const subRoom = { id: 'rid-1', rid: 'rid-1', t: 'c', name: 'general' };

const flush = () => Promise.resolve().then(() => Promise.resolve());

const makeRecord = (row: Record<string, unknown>) => {
	let emit: ((row: unknown) => void) | undefined;
	let complete: (() => void) | undefined;
	const unsubscribe = jest.fn();
	const record = {
		...row,
		observe: jest.fn(() => ({
			subscribe: (observer: { next: (row: unknown) => void; complete?: () => void }) => {
				emit = observer.next;
				complete = observer.complete;
				observer.next(record);
				return { unsubscribe };
			}
		}))
	};
	return {
		record,
		unsubscribe,
		emit: (next: Record<string, unknown>) => emit?.(next),
		destroy: () => complete?.()
	};
};

const setupPresentRow = (row: Record<string, unknown> = subRoom) => {
	const { record, emit, destroy, unsubscribe } = makeRecord(row);
	const find = jest.fn(() => Promise.resolve(record));
	mockGet.mockReturnValue({ find });
	return { emit, destroy, unsubscribe, find };
};

const setupAbsentThenPresentRow = () => {
	const find = jest.fn(() => Promise.reject(new Error('not found')));
	let emitRows: ((rows: unknown[]) => void) | undefined;
	const queryUnsubscribe = jest.fn();
	const observe = jest.fn(() => ({
		subscribe: (next: (rows: unknown[]) => void) => {
			emitRows = next;
			return { unsubscribe: queryUnsubscribe };
		}
	}));
	const query = jest.fn(() => ({ observe }));
	mockGet.mockReturnValue({ find, query });
	return {
		find,
		queryUnsubscribe,
		emitRows: (rows: unknown[]) => emitRows?.(rows)
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
		expect(store.getState().joined).toBe(true);
		expect(store.getState().member).toEqual({});
	});

	it('publishes the found record and keeps observing it, with no early return on repeated emissions', async () => {
		const { emit } = setupPresentRow();
		const store = createRoomStore({ rid: 'rid-1', initialRoom: stubRoom });
		observeRoom('rid-1', store);
		await flush();

		emit(subRoom);
		expect(store.getState().room).toBe(subRoom);
		expect(store.getState().joined).toBe(true);

		const mutated = { ...subRoom, topic: 'new' };
		emit(mutated);
		expect(store.getState().room).toBe(mutated);
	});

	it('sets joined false for a non-DM room when the record is destroyed', async () => {
		const { emit, destroy } = setupPresentRow();
		const store = createRoomStore({ rid: 'rid-1', initialRoom: stubRoom });
		observeRoom('rid-1', store);
		await flush();

		emit(subRoom);
		expect(store.getState().joined).toBe(true);

		destroy();
		expect(store.getState().joined).toBe(false);
	});

	it('leaves a DM room untouched when its record is destroyed', async () => {
		const dmRow = { ...subRoom, t: 'd' };
		const { emit, destroy } = setupPresentRow(dmRow);
		const store = createRoomStore({ rid: 'rid-1', initialRoom: { ...stubRoom, t: 'd' } });
		observeRoom('rid-1', store);
		await flush();

		emit(dmRow);
		expect(store.getState().joined).toBe(true);

		destroy();
		expect(store.getState().joined).toBe(true);
		expect(store.getState().room).toBe(dmRow);
	});

	it('flips joined false for a non-DM room whose subscription is not yet found', async () => {
		setupAbsentThenPresentRow();
		const store = createRoomStore({ rid: 'rid-1', initialRoom: stubRoom });
		observeRoom('rid-1', store);
		await flush();

		expect(store.getState().joined).toBe(false);
	});

	it('leaves a DM room joined while its subscription is not yet found', async () => {
		setupAbsentThenPresentRow();
		const store = createRoomStore({ rid: 'rid-1', initialRoom: { ...stubRoom, t: 'd' } });
		observeRoom('rid-1', store);
		await flush();

		expect(store.getState().joined).toBe(true);
	});

	it('switches from the query observable to the record observable once a row appears, and unsubscribes the query', async () => {
		const { emitRows, queryUnsubscribe } = setupAbsentThenPresentRow();
		const store = createRoomStore({ rid: 'rid-1', initialRoom: stubRoom });
		observeRoom('rid-1', store);
		await flush();

		const { record, emit } = makeRecord(subRoom);
		emitRows([record]);

		expect(queryUnsubscribe).toHaveBeenCalledTimes(1);
		expect(store.getState().room).toBe(record);
		expect(store.getState().joined).toBe(true);

		const mutated = { ...subRoom, name: 'renamed', observe: record.observe };
		emit(mutated);
		expect(store.getState().room).toBe(mutated);
	});

	it('does not throw when the query observable emits a row synchronously on subscribe', async () => {
		const find = jest.fn(() => Promise.reject(new Error('not found')));
		const { record, emit } = makeRecord(subRoom);
		const queryUnsubscribe = jest.fn();
		const observe = jest.fn(() => ({
			subscribe: (next: (rows: unknown[]) => void) => {
				next([record]);
				return { unsubscribe: queryUnsubscribe };
			}
		}));
		const query = jest.fn(() => ({ observe }));
		mockGet.mockReturnValue({ find, query });

		const store = createRoomStore({ rid: 'rid-1', initialRoom: stubRoom });
		expect(() => observeRoom('rid-1', store)).not.toThrow();
		await flush();

		expect(queryUnsubscribe).toHaveBeenCalledTimes(1);
		expect(store.getState().room).toBe(record);

		const mutated = { ...subRoom, name: 'renamed', observe: record.observe };
		emit(mutated);
		expect(store.getState().room).toBe(mutated);
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

	it('join() sets joined true', async () => {
		setupAbsentThenPresentRow();
		const store = createRoomStore({ rid: 'rid-1', initialRoom: stubRoom });
		observeRoom('rid-1', store);
		await flush();

		expect(store.getState().joined).toBe(false);

		store.getState().join();

		expect(store.getState().joined).toBe(true);
	});
});
