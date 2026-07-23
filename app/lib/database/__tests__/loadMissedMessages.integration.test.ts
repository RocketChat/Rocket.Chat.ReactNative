import { Q } from '@nozbe/watermelondb';

import type { TAppDatabase } from '../interfaces';
import type { TMessageModel, TSubscriptionModel } from '../../../definitions';
import { createLokiTestDatabase, resetLokiTestDatabase, seedMessage, seedSubscription } from './lokiTestDatabase';
import { createFakeSyncServer, type IFakeServerMessage } from './fakeSyncServer';

// Real persistence + real cursor: point `database.active` at the live LokiJS DB so
// `loadMissedMessages` drives the real `updateMessages` (create/remove through the
// WMDB writer lock) and the real `advanceSyncCursor`. Only the outer edges are mocked:
// `sdk` (the network), `auxStore` (server version), `encryption` (pass-through), `log`.
let mockActiveDatabase: TAppDatabase;
jest.mock('../../database', () => ({
	__esModule: true,
	default: {
		get active() {
			return mockActiveDatabase;
		}
	}
}));

let mockServerVersion = '8.5.1';
jest.mock('../../store/auxStore', () => ({
	store: {
		getState: () => ({ server: { version: mockServerVersion } })
	}
}));

jest.mock('../../services/sdk', () => ({
	__esModule: true,
	default: { get: jest.fn() }
}));

jest.mock('../../encryption', () => ({
	Encryption: { decryptMessages: (messages: unknown) => Promise.resolve(messages) }
}));

jest.mock('../../methods/helpers/log', () => ({ __esModule: true, default: jest.fn() }));

// eslint-disable-next-line import/first
import sdk from '../../services/sdk';
// eslint-disable-next-line import/first
import { loadMissedMessages } from '../../methods/loadMissedMessages';

const mockedSdkGet = sdk.get as jest.MockedFunction<typeof sdk.get>;

const RID = 'room-1';
const T0 = Date.UTC(2026, 6, 22, 12, 0, 0);
const T1 = T0 + 1000;
const T2 = T0 + 2000;
const T3 = T0 + 3000;
const T5 = T0 + 5000;

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

const persistedLastOpen = async (rid = RID): Promise<number | undefined> => {
	const subscription = (await mockActiveDatabase.get('subscriptions').find(rid)) as TSubscriptionModel;
	return subscription.lastOpen?.getTime();
};

describe('loadMissedMessages (LokiJS integration)', () => {
	beforeAll(() => {
		mockActiveDatabase = createLokiTestDatabase();
	});

	beforeEach(async () => {
		await resetLokiTestDatabase(mockActiveDatabase);
		server.reset();
		mockServerVersion = '8.5.1';
		mockedSdkGet.mockReset();
		server.installOn(mockedSdkGet as unknown as Parameters<typeof server.installOn>[0]);
	});

	it('initial fetch seeds both cursors from lastOpen: persists new updates and applies deletions', async () => {
		await seedSubscription(mockActiveDatabase, { rid: RID, lastOpen: new Date(T0) });
		// a message deleted after the cursor must pre-exist to be removed
		await seedMessage(mockActiveDatabase, { id: 'gone', rid: RID, updatedAt: new Date(T2) });
		server.updated.push(serverMessage('new', T1), serverMessage('stale', T0 - 1000));
		server.deleted.push(serverMessage('gone', T2));

		await loadMissedMessages({ rid: RID, lastOpen: new Date(T0) });

		// the new update (>T0) is persisted; the stale one (<=T0) never arrives; the deletion is applied
		expect(await persistedMessageIds()).toEqual(['new']);
		// both streams were queried off the initial lastOpen cursor
		const cursors = mockedSdkGet.mock.calls.map(([, params]) => params as unknown as Record<string, unknown>);
		expect(cursors).toContainEqual({ roomId: RID, next: T0, count: 50, type: 'UPDATED' });
		expect(cursors).toContainEqual({ roomId: RID, next: T0, count: 50, type: 'DELETED' });
	});

	it('follows the UPDATED cursor across pages (awaited recursion) and advances lastOpen once to the batch max', async () => {
		await seedSubscription(mockActiveDatabase, { rid: RID, lastOpen: new Date(T0) });
		server.updated.push(serverMessage('u1', T1), serverMessage('u2', T2), serverMessage('u3', T3));
		const paged = createFakeSyncServer({ updatedPageSize: 1 });
		paged.updated.push(...server.updated);
		paged.installOn(mockedSdkGet as unknown as Parameters<typeof paged.installOn>[0]);

		await loadMissedMessages({ rid: RID, lastOpen: new Date(T0) });

		// every page landed via the awaited recursion
		expect(await persistedMessageIds()).toEqual(['u1', 'u2', 'u3']);
		// the cursor advanced to the max _updatedAt of the whole chain
		expect(await persistedLastOpen()).toBe(T3);
	});

	it('applies a paginated DELETED-only sync as removals, never as upserts (no positional-slot bug)', async () => {
		await seedSubscription(mockActiveDatabase, { rid: RID, lastOpen: new Date(T0) });
		await seedMessage(mockActiveDatabase, { id: 'd1', rid: RID, updatedAt: new Date(T1) });
		await seedMessage(mockActiveDatabase, { id: 'd2', rid: RID, updatedAt: new Date(T2) });
		await seedMessage(mockActiveDatabase, { id: 'd3', rid: RID, updatedAt: new Date(T3) });
		const paged = createFakeSyncServer({ deletedPageSize: 2 });
		paged.deleted.push(serverMessage('d1', T1), serverMessage('d2', T2), serverMessage('d3', T3));
		paged.installOn(mockedSdkGet as unknown as Parameters<typeof paged.installOn>[0]);

		await loadMissedMessages({ rid: RID, lastOpen: new Date(T0) });

		// all three removed; none resurrected into the updated slot
		expect(await persistedMessageIds()).toEqual([]);
		expect(await persistedLastOpen()).toBe(T3);
	});

	it('does not advance the cursor when a later page fails, even after earlier pages persisted', async () => {
		await seedSubscription(mockActiveDatabase, { rid: RID, lastOpen: new Date(T0) });
		await seedMessage(mockActiveDatabase, { id: 'd1', rid: RID, updatedAt: new Date(T1) });
		await seedMessage(mockActiveDatabase, { id: 'd2', rid: RID, updatedAt: new Date(T2) });
		await seedMessage(mockActiveDatabase, { id: 'd3', rid: RID, updatedAt: new Date(T3) });
		const paged = createFakeSyncServer({ deletedPageSize: 2 });
		paged.deleted.push(serverMessage('d1', T1), serverMessage('d2', T2), serverMessage('d3', T3));
		paged.failDeletedPageAtRequest = 2;
		paged.installOn(mockedSdkGet as unknown as Parameters<typeof paged.installOn>[0]);

		await expect(loadMissedMessages({ rid: RID, lastOpen: new Date(T0) })).rejects.toThrow();

		// page 1 persisted (d1, d2 removed), but the failed chain left the cursor untouched for retry
		expect(await persistedMessageIds()).toEqual(['d3']);
		expect(await persistedLastOpen()).toBe(T0);
	});

	it('leaves the cursor unchanged when the fetch is empty (server answers a current/future cursor)', async () => {
		await seedSubscription(mockActiveDatabase, { rid: RID, lastOpen: new Date(T5) });
		server.updated.push(serverMessage('old', T2));

		await loadMissedMessages({ rid: RID, lastOpen: new Date(T5) });

		expect(await persistedMessageIds()).toEqual([]);
		expect(await persistedLastOpen()).toBe(T5);
	});

	it('uses the lastOpen argument over the subscription record when both are present', async () => {
		await seedSubscription(mockActiveDatabase, { rid: RID, lastOpen: new Date(T0) });
		server.updated.push(serverMessage('between', T1), serverMessage('after', T3));

		// arg cursor is T2; the record cursor is the older T0
		await loadMissedMessages({ rid: RID, lastOpen: new Date(T2) });

		// only messages newer than the argument cursor arrive
		expect(await persistedMessageIds()).toEqual(['after']);
	});

	it('falls back to the subscription lastOpen when no argument is given', async () => {
		await seedSubscription(mockActiveDatabase, { rid: RID, lastOpen: new Date(T2) });
		server.updated.push(serverMessage('between', T1), serverMessage('after', T3));

		await loadMissedMessages({ rid: RID });

		expect(await persistedMessageIds()).toEqual(['after']);
	});

	it('issues no request and persists nothing when there is no subscription and no argument cursor', async () => {
		server.updated.push(serverMessage('any', T3));

		await loadMissedMessages({ rid: RID });

		expect(mockedSdkGet).not.toHaveBeenCalled();
		expect(await persistedMessageIds()).toEqual([]);
	});

	it('legacy <7.1 servers still issue the sync call with an ISO lastUpdate', async () => {
		mockServerVersion = '7.0.0';
		await seedSubscription(mockActiveDatabase, { rid: RID, lastOpen: new Date(T0) });
		// the <7.1 endpoint answers a single `{ updated, deleted }` payload, not the cursor API
		// the fake server models; stub it directly here.
		mockedSdkGet.mockResolvedValue({ result: { updated: [], deleted: [] } } as never);

		await loadMissedMessages({ rid: RID, lastOpen: new Date(T0) });

		expect(mockedSdkGet).toHaveBeenCalledWith('chat.syncMessages', {
			roomId: RID,
			lastUpdate: new Date(T0).toISOString()
		});
	});
});
