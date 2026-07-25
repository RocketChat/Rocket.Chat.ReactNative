import { Q } from '@nozbe/watermelondb';

import type { TAppDatabase } from '../interfaces';
import type { TMessageModel, TSubscriptionModel } from '../../../definitions';
import {
	closeLokiTestDatabase,
	createLokiTestDatabase,
	resetLokiTestDatabase,
	seedMessage,
	seedSubscription
} from './lokiTestDatabase';
import { createFakeSyncServer, type IFakeServerMessage } from './fakeSyncServer';
import { MessageTypeLoad } from '../../constants/messageTypeLoad';
import { messagesStatus } from '../../constants/messagesStatus';
import sdk from '../../services/sdk';
import { loadMissedMessages } from '../../methods/loadMissedMessages';

// Recurrence of #7499 for rooms whose subscription row has NO sync cursor: a room reached by
// tapping a push notification is persisted without `lastOpen`, so every case here deliberately
// leaves it unseeded — the gap that let the defect survive `reconnectCycle.integration.test.ts`.
// Same real-WMDB setup as that suite: `database.active` is the live LokiJS DB, only the outer
// edges (`sdk`, `auxStore`, `encryption`, `log`) are mocked.
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

const RID = 'room-1';
const JOINED = Date.UTC(2026, 6, 22, 10, 0, 0); // subscription ts: the user joined the room
const LOCAL_TIP = Date.UTC(2026, 6, 22, 11, 0, 0); // newest message this device actually persisted
const GAP_TS = Date.UTC(2026, 6, 22, 11, 30, 0); // a message that only ever reached the server
const READ = Date.UTC(2026, 6, 22, 12, 0, 0); // subscription ls: last read, still no lastOpen
const MSG_TS = READ + 60_000; // a message lands on the server 1 min after the last read
const DEVICE_CLOCK = Date.UTC(2026, 6, 22, 13, 0, 0); // a device clock running an hour ahead

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

const persistedLastOpen = async (): Promise<number | undefined> => {
	const subscription = (await mockActiveDatabase.get('subscriptions').find(RID)) as TSubscriptionModel;
	return subscription.lastOpen?.getTime();
};

describe('null sync cursor recurrence (#7499, LokiJS integration)', () => {
	beforeAll(() => {
		mockActiveDatabase = createLokiTestDatabase();
	});

	afterAll(() => closeLokiTestDatabase(mockActiveDatabase));

	beforeEach(async () => {
		await resetLokiTestDatabase(mockActiveDatabase);
		server.reset();
		mockedSdkGet.mockReset();
		server.installOn(mockedSdkGet as unknown as Parameters<typeof server.installOn>[0]);
	});

	it('notification-tap room (no lastOpen): syncs off `ls` instead of fetching nothing', async () => {
		await seedSubscription(mockActiveDatabase, { rid: RID, ts: new Date(JOINED), ls: new Date(READ) });
		server.updated.push(serverMessage('missed-1', MSG_TS));

		await loadMissedMessages({ rid: RID });

		expect(mockedSdkGet).toHaveBeenCalledWith('chat.syncMessages', expect.objectContaining({ roomId: RID, next: READ }));
		expect(await persistedMessageIds()).toEqual(['missed-1']);
		// the recovered sync seeds the cursor from the server timestamp it just read
		expect(await persistedLastOpen()).toBe(MSG_TS);
	});

	// `ls` is the server-side last-read stamp and ANY device writes it: reading the room on desktop
	// pushes it past messages this device never received. The fallback has to express the newest
	// point THIS device is in sync with, so what it has persisted outranks what someone else read.
	it('`ls` ahead of the device (read elsewhere): syncs off the newest persisted message, not `ls`', async () => {
		await seedSubscription(mockActiveDatabase, { rid: RID, ts: new Date(JOINED), ls: new Date(READ) });
		await seedMessage(mockActiveDatabase, { id: 'local-1', rid: RID, updatedAt: new Date(LOCAL_TIP) });
		// posted after this device went quiet, but before the desktop read moved `ls` past it
		server.updated.push(serverMessage('gap-1', GAP_TS));

		await loadMissedMessages({ rid: RID });

		expect(mockedSdkGet).toHaveBeenCalledWith('chat.syncMessages', expect.objectContaining({ next: LOCAL_TIP }));
		expect(await persistedMessageIds()).toEqual(['gap-1', 'local-1']);
		expect(await persistedLastOpen()).toBe(GAP_TS);
	});

	// Not every messages row carries a SERVER stamp: the synthetic load-more sentinel and outgoing
	// TEMP/ERROR sends are stamped with `new Date()`. On a device whose clock runs ahead, taking
	// those as the cursor asks the server for changes newer than the device clock — the very
	// clock-poisoning this cursor exists to prevent.
	it.each([
		['load-more sentinel', { t: MessageTypeLoad.MORE }],
		['failed outgoing send', { status: messagesStatus.ERROR }]
	])('device-stamped row (%s) is not taken as the cursor', async (_label, poison) => {
		await seedSubscription(mockActiveDatabase, { rid: RID, ts: new Date(JOINED), ls: new Date(READ) });
		await seedMessage(mockActiveDatabase, { id: 'local-1', rid: RID, updatedAt: new Date(LOCAL_TIP) });
		await seedMessage(mockActiveDatabase, { id: 'poison-1', rid: RID, updatedAt: new Date(DEVICE_CLOCK), ...poison });
		server.updated.push(serverMessage('gap-1', GAP_TS));

		await loadMissedMessages({ rid: RID });

		expect(mockedSdkGet).toHaveBeenCalledWith('chat.syncMessages', expect.objectContaining({ next: LOCAL_TIP }));
		expect(await persistedMessageIds()).toContain('gap-1');
	});

	it('never-read room (no lastOpen, no ls): syncs off the subscription `ts`', async () => {
		await seedSubscription(mockActiveDatabase, { rid: RID, ts: new Date(JOINED) });
		server.updated.push(serverMessage('missed-1', MSG_TS));

		await loadMissedMessages({ rid: RID });

		expect(mockedSdkGet).toHaveBeenCalledWith('chat.syncMessages', expect.objectContaining({ roomId: RID, next: JOINED }));
		expect(await persistedMessageIds()).toEqual(['missed-1']);
		expect(await persistedLastOpen()).toBe(MSG_TS);
	});

	it('deleted messages are synced off the fallback cursor too', async () => {
		await seedSubscription(mockActiveDatabase, { rid: RID, ts: new Date(JOINED), ls: new Date(READ) });
		server.deleted.push(serverMessage('gone-1', MSG_TS));

		await loadMissedMessages({ rid: RID });

		expect(mockedSdkGet).toHaveBeenCalledWith('chat.syncMessages', expect.objectContaining({ type: 'DELETED', next: READ }));
		expect(await persistedLastOpen()).toBe(MSG_TS);
	});

	// `advanceSyncCursor` cannot persist a cursor for a room it has no subscription row for, so a
	// sync that races ahead of the rooms sync drops it. That must cost a redundant fetch, never a
	// message: once the row lands (still cursor-less), the next sync has to re-deliver.
	it('subscription row missing at sync time: the message still arrives once the row lands', async () => {
		server.updated.push(serverMessage('missed-1', MSG_TS));

		await loadMissedMessages({ rid: RID });
		expect(await persistedMessageIds()).toEqual([]);

		await seedSubscription(mockActiveDatabase, { rid: RID, ts: new Date(JOINED), ls: new Date(READ) });
		await loadMissedMessages({ rid: RID });

		expect(await persistedMessageIds()).toEqual(['missed-1']);
		expect(await persistedLastOpen()).toBe(MSG_TS);
	});

	it('an explicit lastOpen argument still wins over the fallback', async () => {
		await seedSubscription(mockActiveDatabase, { rid: RID, ts: new Date(JOINED), ls: new Date(READ) });
		server.updated.push(serverMessage('missed-1', MSG_TS));

		await loadMissedMessages({ rid: RID, lastOpen: new Date(JOINED) });

		expect(mockedSdkGet).toHaveBeenCalledWith('chat.syncMessages', expect.objectContaining({ next: JOINED }));
		expect(await persistedMessageIds()).toEqual(['missed-1']);
	});
});
