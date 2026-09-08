import { loadThreadMessages } from '../../../../lib/methods/loadThreadMessages';
import { readMessages } from '../../../../lib/methods/readMessages';
import { getUserInfo } from '../../../../lib/services/restApi';
import { isGroupChat } from '../../../../lib/methods/helpers';
import { isInviteSubscription } from '../../../../lib/methods/isInviteSubscription';
import log from '../../../../lib/methods/helpers/log';
import getMessages from '../../services/getMessages';
import { createRoomStore, observeRoom } from '../RoomStore';
import { setupObserveRoomDatabase } from './observeRoomHarness';

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

describe('RoomStore', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockIsGroupChat.mockReturnValue(false);
		mockIsInviteSubscription.mockReturnValue(false);
		mockGetMessages.mockResolvedValue(undefined);
		mockLoadThreadMessages.mockResolvedValue(undefined);
	});

	it('observes the tracked database columns with their model-field translations', () => {
		const { observeWithColumns } = setupObserveRoomDatabase();
		createObservedStore({ initialRoom: stubRoom });

		expect(observeWithColumns).toHaveBeenCalledWith([
			'f',
			'ro',
			'blocked',
			'blocker',
			'archived',
			'tunread',
			'tunread_user',
			'tunread_group',
			'muted',
			'ignored',
			'jitsi_timeout',
			'announcement',
			'sys_mes',
			'topic',
			'name',
			'fname',
			'roles',
			'banner_closed',
			'visitor',
			'join_code_required',
			'team_main',
			'team_id',
			'status',
			'on_hold',
			't',
			'auto_translate',
			'auto_translate_language',
			'unmuted',
			'e2e_key',
			'encrypted',
			'inviter',
			'last_message'
		]);
	});

	it('exposes the initial room synchronously on creation', () => {
		setupObserveRoomDatabase();
		const store = createObservedStore({ initialRoom: stubRoom });

		expect(store.getState().room.room).toBe(stubRoom);
		expect(store.getState().joined).toBe(true);
		expect(store.getState().subscribed).toBe(false);
		expect(store.getState().member).toEqual({});
	});

	it('flips to preview mode (not subscribed, not joined) when a non-DM has no subscription', () => {
		const { emit } = setupObserveRoomDatabase();
		const store = createObservedStore({ initialRoom: stubRoom });

		emit([]);

		expect(store.getState().subscribed).toBe(false);
		expect(store.getState().joined).toBe(false);
		expect(store.getState().room.room).toBe(stubRoom);
	});

	it('keeps a DM joined even with no subscription yet', () => {
		const { emit } = setupObserveRoomDatabase();
		const store = createObservedStore({ initialRoom: { ...stubRoom, t: 'd' } });

		emit([]);

		expect(store.getState().subscribed).toBe(false);
		expect(store.getState().joined).toBe(true);
	});

	it('flips joined back to true once the subscription appears later', () => {
		const { emit } = setupObserveRoomDatabase();
		const store = createObservedStore({ initialRoom: stubRoom });

		emit([]);
		expect(store.getState().joined).toBe(false);

		emit([subRoom]);
		expect(store.getState().joined).toBe(true);
		expect(store.getState().subscribed).toBe(true);
	});

	it('replaces the observed read when the same model instance re-emits a mutated column', () => {
		const { emit } = setupObserveRoomDatabase();
		const mutable = { ...subRoom, topic: 'old' };
		const store = createObservedStore({ initialRoom: stubRoom });

		emit([mutable]);
		const first = store.getState().room;
		expect((first.room as any).topic).toBe('old');

		// observeWithColumns re-emits the same cached instance, mutated in place
		mutable.topic = 'new';
		emit([mutable]);

		expect(store.getState().room.room).toBe(mutable);
		expect((store.getState().room.room as any).topic).toBe('new');
		expect(store.getState().room).not.toBe(first);
	});

	it('keeps room pointing at the live model instance when only lastMessage changes on a Livechat row', () => {
		const { emit } = setupObserveRoomDatabase();
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
		expect(store.getState().room.room).toBe(mutable);
	});

	it('replaces room when the subscription row is recreated with identical attributes', () => {
		const { emit } = setupObserveRoomDatabase();
		const store = createObservedStore({ initialRoom: stubRoom });

		emit([subRoom]);
		emit([]);
		const recreated = { ...subRoom, id: 'sub-2' };
		emit([recreated]);

		expect(store.getState().subscribed).toBe(true);
		expect(store.getState().room.room).toBe(recreated);
	});

	it('retains tracked values when observation is reattached to the same store', () => {
		const { emit } = setupObserveRoomDatabase();
		const mutable = { ...subRoom, topic: 'same' };
		const store = createObservedStore({ initialRoom: stubRoom });
		emit([mutable]);
		const first = store.getState().room;

		const cleanup = observeRoom('rid-1', store);
		cleanup();
		observeRoom('rid-1', store);
		emit([mutable]);

		expect(store.getState().room).toBe(first);
	});

	it('keeps the snapshot when observation reattaches to the same store and the record is unchanged', () => {
		const { emit } = setupObserveRoomDatabase();
		const mutable = { ...subRoom, topic: 'same' };
		const store = createRoomStore({ rid: 'rid-1', initialRoom: stubRoom });
		const cleanup = observeRoom('rid-1', store);
		emit([mutable]);
		const first = store.getState().roomSnapshot;
		cleanup();

		observeRoom('rid-1', store);
		emit([mutable]);

		expect(store.getState().roomSnapshot).toBe(first);
	});

	it('keeps two observers of the same store in sync on repeated unchanged emissions', () => {
		const { emit } = setupObserveRoomDatabase();
		const mutable = { ...subRoom, topic: 'same' };
		const store = createRoomStore({ rid: 'rid-1', initialRoom: stubRoom });
		observeRoom('rid-1', store);
		observeRoom('rid-1', store);

		emit([mutable]);
		const first = store.getState().room;

		emit([mutable]);

		expect(store.getState().room).toBe(first);
	});

	it('derives the agent-authored flag from a Livechat row', () => {
		const { emit } = setupObserveRoomDatabase();
		const store = createObservedStore({ initialRoom: stubRoom });

		emit([{ id: 'sub-1', rid: 'rid-1', t: 'l', lastMessage: { u: { _id: 'agent-1' } } }]);

		expect(store.getState().lastMessageFromAgent).toBe(true);
	});

	it('does not update the agent-authored flag for a Channel last Message', () => {
		const { emit } = setupObserveRoomDatabase();
		const store = createObservedStore({ initialRoom: stubRoom });

		emit([{ ...subRoom, lastMessage: { u: { _id: 'agent-1' } } }]);

		expect(store.getState().lastMessageFromAgent).toBe(false);
	});

	it('clears the agent-authored flag when the row stops being a Livechat room', () => {
		const { emit } = setupObserveRoomDatabase();
		const store = createObservedStore({ initialRoom: stubRoom });

		emit([{ id: 'sub-1', rid: 'rid-1', t: 'l', lastMessage: { u: { _id: 'agent-1' } } }]);
		expect(store.getState().lastMessageFromAgent).toBe(true);

		emit([{ id: 'sub-1', rid: 'rid-1', t: 'c', lastMessage: { u: { _id: 'agent-1' } } }]);

		expect(store.getState().lastMessageFromAgent).toBe(false);
	});

	it('runs the main init path: fetches messages and sets member and canAutoTranslate', async () => {
		setupObserveRoomDatabase();
		const store = createObservedStore({ initialRoom: subRoom });

		await store.getState().init();

		expect(mockGetMessages).toHaveBeenCalledWith(expect.objectContaining({ rid: 'rid-1', t: 'c' }));
		expect(store.getState().member).toEqual({});
		expect(store.getState().canAutoTranslate).toBe(true);
	});

	it('loads messages without a read receipt for a route-param room that lacks a subscription row', async () => {
		setupObserveRoomDatabase();
		const store = createObservedStore({ initialRoom: stubRoom });

		await store.getState().init();

		expect(mockGetMessages).toHaveBeenCalledWith({ rid: 'rid-1', t: 'c' });
		expect(mockReadMessages).not.toHaveBeenCalled();
	});

	it('routes a cursor-less subscribed room to the room-history loader directly', async () => {
		setupObserveRoomDatabase();
		const store = createObservedStore({ initialRoom: subRoom });

		await store.getState().init();

		expect(mockGetMessages).toHaveBeenCalledTimes(1);
		expect(mockGetMessages).toHaveBeenCalledWith({ rid: 'rid-1', t: 'c' });
		expect(mockReadMessages).toHaveBeenCalledWith('rid-1');
	});

	it('routes a subscribed room with a cursor to the missed-messages loader', async () => {
		setupObserveRoomDatabase();
		const roomWithCursor = { ...subRoom, lastOpen: new Date('2026-01-01T00:00:00.000Z') };
		const store = createObservedStore({ initialRoom: roomWithCursor });

		await store.getState().init();

		expect(mockGetMessages).toHaveBeenCalledTimes(1);
		expect(mockGetMessages).toHaveBeenCalledWith({ rid: 'rid-1' });
	});

	it('runs the thread init path when tmid is set: loads thread messages and fires the callback', async () => {
		setupObserveRoomDatabase();
		const onThreadMessagesLoaded = jest.fn();
		const store = createObservedStore({ initialRoom: subRoom });

		await store.getState().init({ tmid: 'tmid-1', onThreadMessagesLoaded });

		expect(mockLoadThreadMessages).toHaveBeenCalledWith({ tmid: 'tmid-1', rid: 'rid-1' });
		expect(mockGetMessages).not.toHaveBeenCalled();
		expect(onThreadMessagesLoaded).toHaveBeenCalledTimes(1);
	});

	it('early-returns without fetching messages when the room is an invite subscription', async () => {
		setupObserveRoomDatabase();
		mockIsInviteSubscription.mockReturnValue(true);
		const store = createObservedStore({ initialRoom: subRoom });

		await expect(store.getState().init()).resolves.toEqual({ status: 'skipped' });

		expect(mockGetMessages).not.toHaveBeenCalled();
	});

	it('fetches the DM member and sets roomUserId on success', async () => {
		setupObserveRoomDatabase();
		mockGetUserInfo.mockResolvedValue({ success: true, user: { _id: 'uid-1', username: 'alice' } });
		const dmRoom = { ...subRoom, t: 'd' };
		const store = createObservedStore({ initialRoom: dmRoom });

		await store.getState().init();

		expect(mockGetUserInfo).toHaveBeenCalledWith('uid-1');
		expect(store.getState().member).toEqual({ _id: 'uid-1', username: 'alice' });
		expect(store.getState().roomUserId).toBe('uid-1');
	});

	it('leaves roomUserId untouched until getUserInfo resolves', async () => {
		setupObserveRoomDatabase();
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
		setupObserveRoomDatabase();
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
			setupObserveRoomDatabase();
			const error = new Error('boom');
			mockGetMessages.mockRejectedValueOnce(error);
			const store = createObservedStore({ initialRoom: subRoom });

			const initPromise = store.getState().init();
			await jest.advanceTimersByTimeAsync(1000);
			await initPromise;

			expect(mockLog).toHaveBeenCalledWith(error);
		});

		it('retries after a failed attempt and resolves with the lastSeen of the successful one', async () => {
			setupObserveRoomDatabase();
			const unreadRoom = { ...subRoom, alert: true, ls: new Date('2026-01-01T00:00:00.000Z') };
			mockGetMessages.mockRejectedValueOnce(new Error('boom'));
			const store = createObservedStore({ initialRoom: unreadRoom });

			const initPromise = store.getState().init();
			await jest.advanceTimersByTimeAsync(1000);

			await expect(initPromise).resolves.toEqual({ status: 'loaded', lastSeen: unreadRoom.ls });
			expect(mockGetMessages).toHaveBeenCalledTimes(2);
		});

		it('gives up after three attempts and resolves as failed', async () => {
			setupObserveRoomDatabase();
			mockGetMessages.mockRejectedValue(new Error('boom'));
			const store = createObservedStore({ initialRoom: subRoom });

			const initPromise = store.getState().init();
			await jest.advanceTimersByTimeAsync(10000);

			await expect(initPromise).resolves.toEqual({ status: 'failed' });
			expect(mockGetMessages).toHaveBeenCalledTimes(3);
		});

		it('retries against the room the observer delivered after the first attempt failed on an empty store', async () => {
			const { emit } = setupObserveRoomDatabase();
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
			const { emit } = setupObserveRoomDatabase();
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
			setupObserveRoomDatabase();
			mockIsInviteSubscription.mockReturnValue(true);
			const store = createObservedStore({ initialRoom: subRoom });

			const initPromise = store.getState().init();
			await jest.advanceTimersByTimeAsync(10000);

			await expect(initPromise).resolves.toEqual({ status: 'skipped' });
			expect(mockGetMessages).not.toHaveBeenCalled();
		});

		it('stops retrying and reports skipped once the run signal aborts', async () => {
			setupObserveRoomDatabase();
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
		const { emit } = setupObserveRoomDatabase();
		const store = createObservedStore({ initialRoom: stubRoom });

		emit([]);
		expect(store.getState().joined).toBe(false);

		store.getState().join();

		expect(store.getState().joined).toBe(true);
	});
});
