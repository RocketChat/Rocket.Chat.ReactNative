import { Q } from '@nozbe/watermelondb';

import type { TAppDatabase } from '../interfaces';
import type { TMessageModel, TSubscriptionModel } from '../../../definitions';
import { closeLokiTestDatabase, createLokiTestDatabase, resetLokiTestDatabase, seedSubscription } from './lokiTestDatabase';
import { createFakeSyncServer, type IFakeServerMessage } from './fakeSyncServer';
import sdk from '../../services/sdk';
import { loadMissedMessages } from '../../methods/loadMissedMessages';
import { readMessages } from '../../methods/readMessages';

// The full open -> sync -> read cycle on a real WMDB core: `database.active` points at the
// live LokiJS DB so `loadMissedMessages` (real `updateMessages` + `advanceSyncCursor`) and
// `readMessages` both drive real persisted rows and the real cursor (`subscription.lastOpen`).
// Only the outer edges are mocked: `sdk` (network), `auxStore` (server version / encryption /
// settings / dispatch), `encryption` (pass-through), `encryption/utils` (no E2EE warning), `log`.
let mockActiveDatabase: TAppDatabase;
jest.mock('../../database', () => ({
	__esModule: true,
	default: {
		get active() {
			return mockActiveDatabase;
		}
	}
}));

jest.mock('../../store/auxStore', () => ({
	store: {
		getState: () => ({
			server: { version: '8.5.1' },
			encryption: { enabled: true },
			settings: { Hide_System_Messages: [] }
		}),
		dispatch: jest.fn()
	}
}));

jest.mock('../../services/sdk', () => ({
	__esModule: true,
	default: { get: jest.fn(), post: jest.fn() }
}));

jest.mock('../../encryption', () => ({
	Encryption: { decryptMessages: (messages: unknown) => Promise.resolve(messages) }
}));

jest.mock('../../encryption/utils', () => ({ hasE2EEWarning: () => false }));

jest.mock('../../methods/helpers/log', () => ({ __esModule: true, default: jest.fn() }));

const mockedSdkGet = sdk.get as jest.MockedFunction<typeof sdk.get>;
const mockedSdkPost = sdk.post as jest.MockedFunction<typeof sdk.post>;

const RID = 'room-1';
const T0 = Date.UTC(2026, 6, 22, 12, 0, 0); // server time the room last synced to
const MSG_TS = T0 + 60_000; // a message lands on the server 1 min later
const READ_1 = T0 + 300_000; // client reads/leaves 5 min after T0
const READ_2 = T0 + 600_000; // a later reopen, 10 min after T0
const SKEW = 120_000; // client clock 2 min ahead of the server

const server = createFakeSyncServer();

const serverMessage = (id: string, updatedAt: number): IFakeServerMessage => ({
	_id: id,
	rid: RID,
	msg: `msg-${id}`,
	ts: new Date(updatedAt).toISOString(),
	_updatedAt: updatedAt
});

const persistedMessageIds = async (): Promise<string[]> => {
	const rows = (await mockActiveDatabase.get('messages').query(Q.where('rid', RID)).fetch()) as TMessageModel[];
	return rows.map(row => row.id).sort();
};

const persistedSubscription = async (rid = RID): Promise<TSubscriptionModel> =>
	(await mockActiveDatabase.get('subscriptions').find(rid)) as TSubscriptionModel;

const persistedLastOpen = async (): Promise<number | undefined> => (await persistedSubscription()).lastOpen?.getTime();

// Mirrors RoomView.init: pull whatever was missed off the server-derived cursor, then mark the
// room read at the client clock. loadMissedMessages reads the cursor from the live subscription.
const openRoom = async (clientNow: Date): Promise<void> => {
	await loadMissedMessages({ rid: RID });
	await readMessages(RID, clientNow);
};

describe('reconnect / offline coverage-gap cycle (LokiJS integration)', () => {
	beforeAll(() => {
		mockActiveDatabase = createLokiTestDatabase();
	});

	afterAll(() => closeLokiTestDatabase(mockActiveDatabase));

	beforeEach(async () => {
		await resetLokiTestDatabase(mockActiveDatabase);
		server.reset();
		mockedSdkGet.mockReset();
		server.installOn(mockedSdkGet as unknown as Parameters<typeof server.installOn>[0]);
		mockedSdkPost.mockReset();
		mockedSdkPost.mockResolvedValue({ success: true } as never);
	});

	it('offline gap: reading/leaving never advances the cursor, and the next sync delivers the missed message', async () => {
		await seedSubscription(mockActiveDatabase, { rid: RID, lastOpen: new Date(T0) });
		// a correspondent posts while the device is offline; the client never receives it over the
		// stream, so it lives only on the server, newer than the cursor
		server.updated.push(serverMessage('offline-1', MSG_TS));

		// user reads/leaves the room 5 min later — plain wall clock, no skew
		await readMessages(RID, new Date(READ_1));

		// the read stamped `ls` (client clock) but must NOT touch the sync cursor, and nothing synced yet
		const afterRead = await persistedSubscription();
		expect(afterRead.lastOpen?.getTime()).toBe(T0);
		expect(afterRead.ls?.getTime()).toBe(READ_1);
		expect(await persistedMessageIds()).toEqual([]);

		// next sync (back online) loads the message off the untouched cursor and advances to its server ts
		await loadMissedMessages({ rid: RID });
		expect(await persistedMessageIds()).toEqual(['offline-1']);
		expect(await persistedLastOpen()).toBe(MSG_TS);
	});

	it('clock skew (#7499): a message inside the skew window is delivered on tap and survives later reopens', async () => {
		await seedSubscription(mockActiveDatabase, { rid: RID, lastOpen: new Date(T0) });

		// user opens/reads the room, then backgrounds the app — client clock 2 min ahead of server
		await openRoom(new Date(T0 + SKEW));
		// empty sync + a client-clock read must leave the cursor pinned at the server time
		expect(await persistedLastOpen()).toBe(T0);
		expect((await persistedSubscription()).ls?.getTime()).toBe(T0 + SKEW);

		// correspondent replies 1 min later — its server ts (MSG_TS) is BEHIND the client's read clock
		server.updated.push(serverMessage('missed-1', MSG_TS));

		// notification tap 5 min later: the message is recovered because the cursor tracks server ts,
		// not the client read time (which had already passed MSG_TS)
		await openRoom(new Date(READ_1 + SKEW));
		expect(await persistedMessageIds()).toEqual(['missed-1']);
		expect(await persistedLastOpen()).toBe(MSG_TS);

		// a later reopen keeps it and never re-advances the cursor from the client clock
		await openRoom(new Date(READ_2 + SKEW));
		expect(await persistedMessageIds()).toEqual(['missed-1']);
		expect(await persistedLastOpen()).toBe(MSG_TS);
	});

	it('backgrounded delivery: a message that arrived while backgrounded is delivered on reopen', async () => {
		await seedSubscription(mockActiveDatabase, { rid: RID, lastOpen: new Date(T0) });

		// first open: nothing missed yet
		await openRoom(new Date(T0));
		expect(await persistedMessageIds()).toEqual([]);
		expect(await persistedLastOpen()).toBe(T0);

		// message arrives on the server while the app is backgrounded
		server.updated.push(serverMessage('missed-1', MSG_TS));

		// reopen delivers it and advances the cursor to its server ts
		await openRoom(new Date(READ_1));
		expect(await persistedMessageIds()).toEqual(['missed-1']);
		expect(await persistedLastOpen()).toBe(MSG_TS);
	});

	it('readMessages marks the room read (ls, unread) without ever moving the sync cursor', async () => {
		await seedSubscription(mockActiveDatabase, { rid: RID, lastOpen: new Date(T0) });

		await readMessages(RID, new Date(READ_1));

		const subscription = await persistedSubscription();
		// read state is updated at the client clock...
		expect(subscription.ls?.getTime()).toBe(READ_1);
		expect(subscription.unread).toBe(0);
		expect(subscription.alert).toBe(false);
		// ...but the server-derived cursor is left untouched
		expect(subscription.lastOpen?.getTime()).toBe(T0);
	});
});
