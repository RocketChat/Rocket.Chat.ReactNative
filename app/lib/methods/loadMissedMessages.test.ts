import { loadMissedMessages } from './loadMissedMessages';
import { readMessages } from './readMessages';
import sdk from '../services/sdk';
import { getSubscriptionByRoomId } from '../database/services/Subscription';
import updateMessages from './updateMessages';

jest.mock('../services/sdk', () => ({
	__esModule: true,
	default: {
		get: jest.fn(),
		post: jest.fn(() => Promise.resolve({ success: true }))
	}
}));

jest.mock('./updateMessages', () => jest.fn());

jest.mock('../store/auxStore', () => ({
	store: {
		getState: jest.fn(() => ({
			server: { version: '8.5.1' },
			encryption: { enabled: true }
		})),
		dispatch: jest.fn()
	}
}));

jest.mock('../encryption/utils', () => ({
	hasE2EEWarning: jest.fn(() => false)
}));

const RID = 'ROOM_ID';

// Local subscription record shared by the database mock and the assertions
const mockSubscription: any = {
	rid: RID,
	encrypted: true,
	E2EKey: 'ready',
	lastOpen: undefined as Date | undefined,
	update: (fn: (s: any) => void) => Promise.resolve(fn(mockSubscription))
};

jest.mock('../database', () => ({
	__esModule: true,
	default: {
		active: {
			get: () => ({ find: () => Promise.resolve(mockSubscription) }),
			write: (fn: () => Promise<void>) => fn()
		}
	}
}));

jest.mock('../database/services/Subscription', () => ({
	getSubscriptionByRoomId: jest.fn()
}));

const mockedSdkGet = sdk.get as jest.MockedFunction<typeof sdk.get>;
const mockedUpdateMessages = updateMessages as jest.MockedFunction<typeof updateMessages>;
const mockedGetSubscriptionByRoomId = getSubscriptionByRoomId as jest.MockedFunction<typeof getSubscriptionByRoomId>;

// ---- Fake server ----------------------------------------------------------
// Holds messages with server-side _updatedAt timestamps and answers
// chat.syncMessages the way the >=7.1 cursor API does: updated = messages
// with _updatedAt > next, success:true either way.
type TFakeServerMessage = { _id: string; rid: string; msg: string; ts: string; _updatedAt: number };
const serverMessages: TFakeServerMessage[] = [];
const serverDeleted: TFakeServerMessage[] = [];
const DELETED_PAGE_SIZE = 2;

// Injectable failure: reject the Nth DELETED page request (1-based) to model a
// mid-pagination network error; reset in beforeEach.
let deletedPageRequests = 0;
let failDeletedPageAtRequest: number | null = null;

const serialize = (message: TFakeServerMessage) => ({ ...message, _updatedAt: new Date(message._updatedAt).toISOString() });

const fakeSyncMessages = (params: any) => {
	if (params.type === 'DELETED') {
		deletedPageRequests += 1;
		if (failDeletedPageAtRequest && deletedPageRequests === failDeletedPageAtRequest) {
			throw new Error('DELETED page request failed');
		}
		const matching = serverDeleted
			.filter(message => message._updatedAt > params.next)
			.sort((a, b) => a._updatedAt - b._updatedAt);
		const page = matching.slice(0, DELETED_PAGE_SIZE);
		const next = matching.length > page.length ? page[page.length - 1]._updatedAt : null;
		return { result: { deleted: page.map(serialize), cursor: { next, previous: null } } };
	}
	const updated = serverMessages.filter(message => message._updatedAt > params.next).map(serialize);
	return { result: { updated, cursor: { next: null, previous: null } } };
};

// ---- Local persistence ----------------------------------------------------
const persistedMessageIds = new Set<string>();
const removedMessageIds = new Set<string>();

// ---- Orchestration mirrors RoomView.init (index.tsx:681-695) --------------
// loadMissedMessages advances subscription.lastOpen from server timestamps;
// readMessages only marks the room read (client clock, must NOT move the cursor).
const openRoom = async (clientNow: Date) => {
	const { lastOpen } = mockSubscription;
	await loadMissedMessages({ rid: RID, ...(lastOpen ? { lastOpen } : {}) });
	await readMessages(RID, clientNow);
};

describe('loadMissedMessages + readMessages (RoomView.init order)', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		serverMessages.length = 0;
		serverDeleted.length = 0;
		persistedMessageIds.clear();
		removedMessageIds.clear();
		mockSubscription.lastOpen = undefined;
		deletedPageRequests = 0;
		failDeletedPageAtRequest = null;

		mockedSdkGet.mockImplementation((endpoint: any, params: any): any => {
			if (endpoint === 'chat.syncMessages') {
				return Promise.resolve(fakeSyncMessages(params));
			}
			throw new Error(`Unexpected endpoint ${endpoint}`);
		});
		mockedUpdateMessages.mockImplementation(({ update = [], remove = [] }: any) => {
			update.forEach((message: any) => persistedMessageIds.add(message._id));
			remove.forEach((message: any) => removedMessageIds.add(message._id));
			return Promise.resolve(update.length);
		});
		mockedGetSubscriptionByRoomId.mockImplementation(() => Promise.resolve(mockSubscription));
	});

	it('delivers a message that arrived while backgrounded (client clock in sync)', async () => {
		const T0 = Date.UTC(2026, 6, 22, 12, 0, 0);
		// room previously synced up to server-time T0 (server-derived cursor)
		mockSubscription.lastOpen = new Date(T0);
		await openRoom(new Date(T0));

		// message arrives 1min after the room was closed/opened
		serverMessages.push({
			_id: 'missed-1',
			rid: RID,
			msg: 'hello',
			ts: new Date(T0 + 60_000).toISOString(),
			_updatedAt: T0 + 60_000
		});

		// notification tap 5min later
		await openRoom(new Date(T0 + 300_000));
		expect(persistedMessageIds.has('missed-1')).toBe(true);
	});

	it('delivers a message that arrived right after backgrounding when the client clock is ahead of the server (issue #7499)', async () => {
		const T0 = Date.UTC(2026, 6, 22, 12, 0, 0);
		const SKEW = 120_000; // client clock 2min ahead of server
		const clientNow = (serverTime: number) => new Date(serverTime + SKEW);

		// room previously synced up to server-time T0 (server-derived cursor)
		mockSubscription.lastOpen = new Date(T0);

		// user reads the room, then backgrounds the app
		await openRoom(clientNow(T0));

		// correspondent replies 1min later (inside the skew window); push arrives
		serverMessages.push({
			_id: 'missed-1',
			rid: RID,
			msg: 'hello',
			ts: new Date(T0 + 60_000).toISOString(),
			_updatedAt: T0 + 60_000
		});

		// user taps the notification 5min later
		await openRoom(clientNow(T0 + 300_000));
		expect(persistedMessageIds.has('missed-1')).toBe(true);

		// later reopens keep it: the cursor only advances from server timestamps
		await openRoom(clientNow(T0 + 600_000));
		expect(persistedMessageIds.has('missed-1')).toBe(true);
	});

	it('applies paginated deletions as removals, never as updates', async () => {
		const T0 = Date.UTC(2026, 6, 22, 12, 0, 0);
		mockSubscription.lastOpen = new Date(T0);

		// three deletions after the cursor: page size 2 forces DELETED-only pagination
		serverDeleted.push(
			{ _id: 'deleted-1', rid: RID, msg: '', ts: new Date(T0 + 10_000).toISOString(), _updatedAt: T0 + 10_000 },
			{ _id: 'deleted-2', rid: RID, msg: '', ts: new Date(T0 + 20_000).toISOString(), _updatedAt: T0 + 20_000 },
			{ _id: 'deleted-3', rid: RID, msg: '', ts: new Date(T0 + 30_000).toISOString(), _updatedAt: T0 + 30_000 }
		);

		await openRoom(new Date(T0 + 300_000));

		expect(removedMessageIds).toEqual(new Set(['deleted-1', 'deleted-2', 'deleted-3']));
		expect(persistedMessageIds.size).toBe(0);
	});

	it('does not advance the cursor when a later DELETED page fails, even after earlier pages persisted', async () => {
		const T0 = Date.UTC(2026, 6, 22, 12, 0, 0);
		mockSubscription.lastOpen = new Date(T0);

		// three deletions after the cursor: page size 2 forces a second DELETED page
		serverDeleted.push(
			{ _id: 'deleted-1', rid: RID, msg: '', ts: new Date(T0 + 10_000).toISOString(), _updatedAt: T0 + 10_000 },
			{ _id: 'deleted-2', rid: RID, msg: '', ts: new Date(T0 + 20_000).toISOString(), _updatedAt: T0 + 20_000 },
			{ _id: 'deleted-3', rid: RID, msg: '', ts: new Date(T0 + 30_000).toISOString(), _updatedAt: T0 + 30_000 }
		);
		failDeletedPageAtRequest = 2;

		await expect(loadMissedMessages({ rid: RID, lastOpen: new Date(T0) })).rejects.toThrow();

		// page 1 was persisted, but the cursor must stay put so the failed page is retried
		expect(removedMessageIds).toEqual(new Set(['deleted-1', 'deleted-2']));
		expect(mockSubscription.lastOpen.getTime()).toBe(T0);
	});
});
