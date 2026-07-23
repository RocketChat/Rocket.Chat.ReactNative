import { Q } from '@nozbe/watermelondb';

import type { TAppDatabase } from '../interfaces';
import type { IMessage, TMessageModel, TSubscriptionModel } from '../../../definitions';
import { createLokiTestDatabase, resetLokiTestDatabase, seedSubscription } from './lokiTestDatabase';

// Real persistence + real cursor: point `database.active` at the live LokiJS DB so
// `loadMessagesForRoom` drives the real `updateMessages`, the real `getMessageById` /
// `getSubscriptionByRoomId` services, and the real `advanceSyncCursor`. Only the outer
// edges are mocked: `sdk` (the *.history network), `auxStore` (settings + dispatch),
// `encryption` (pass-through), `log`.
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
		getState: () => ({ settings: { Hide_System_Messages: [] } }),
		dispatch: jest.fn()
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
import { loadMessagesForRoom } from '../../methods/loadMessagesForRoom';

const mockedSdkGet = sdk.get as jest.MockedFunction<typeof sdk.get>;

const RID = 'room-1';
const T0 = Date.UTC(2026, 6, 22, 12, 0, 0);
const T1 = T0 + 1000;
const T2 = T0 + 2000;
const T3 = T0 + 3000;
const T5 = T0 + 5000;

// A *.history message. `_updatedAt` must be set explicitly: normalizeMessage stamps a
// missing `_updatedAt` with `new Date()`, which would make advanceSyncCursor jump to now.
const historyMessage = (id: string, ts: number, updatedAt: number = ts): IMessage =>
	({
		_id: id,
		rid: RID,
		msg: `msg-${id}`,
		ts: new Date(ts).toISOString(),
		_updatedAt: new Date(updatedAt).toISOString(),
		u: { _id: 'user-1', username: 'user-1' }
	} as unknown as IMessage);

// A partial (< COUNT) batch: single fetch, no recursion, no trailing load-more.
const answerHistoryOnce = (messages: IMessage[]) => mockedSdkGet.mockResolvedValueOnce({ success: true, messages } as never);

const persistedMessageIds = async (): Promise<string[]> => {
	const rows = (await mockActiveDatabase.get('messages').query(Q.where('rid', RID)).fetch()) as TMessageModel[];
	return rows.map(row => row.id).sort();
};

const persistedLastOpen = async (rid = RID): Promise<number | undefined> => {
	const subscription = (await mockActiveDatabase.get('subscriptions').find(rid)) as TSubscriptionModel;
	return subscription.lastOpen?.getTime();
};

describe('loadMessagesForRoom cursor gate (LokiJS integration)', () => {
	beforeAll(() => {
		mockActiveDatabase = createLokiTestDatabase();
	});

	beforeEach(async () => {
		await resetLokiTestDatabase(mockActiveDatabase);
		mockedSdkGet.mockReset();
	});

	it('advances the cursor to the window max on the newest load (no `latest`)', async () => {
		await seedSubscription(mockActiveDatabase, { rid: RID, lastOpen: new Date(T0) });
		answerHistoryOnce([historyMessage('m1', T1), historyMessage('m3', T3), historyMessage('m2', T2)]);

		await loadMessagesForRoom({ rid: RID, t: 'c' });

		expect(await persistedMessageIds()).toEqual(['m1', 'm2', 'm3']);
		expect(await persistedLastOpen()).toBe(T3);
	});

	it('does not advance the cursor for a scroll-up window (`latest` set)', async () => {
		await seedSubscription(mockActiveDatabase, { rid: RID, lastOpen: new Date(T3) });
		// older history paged in above the cursor — an ordinary scroll-up
		answerHistoryOnce([historyMessage('h0', T0), historyMessage('h1', T1), historyMessage('h2', T2)]);

		await loadMessagesForRoom({ rid: RID, t: 'c', latest: new Date(T3) });

		expect(await persistedLastOpen()).toBe(T3);
	});

	it('does not jump the cursor past unsynced newer messages when scroll-up surfaces an edited old message', async () => {
		// The exact case the gate exists for: cursor at T2; newer messages are still
		// unsynced and NOT in this window. Scrolling up loads an OLD message whose recent
		// edit stamped `_updatedAt = T5`. Advancing the cursor to T5 would skip those
		// unsynced messages on the next sync — the gate must keep it pinned at T2.
		await seedSubscription(mockActiveDatabase, { rid: RID, lastOpen: new Date(T2) });
		const editedOldMessage = historyMessage('edited-old', T0, T5);
		answerHistoryOnce([historyMessage('older', T0 - 1000), editedOldMessage]);

		await loadMessagesForRoom({ rid: RID, t: 'c', latest: new Date(T2) });

		// pinned at T2 — not jumped to the edited message's T5
		expect(await persistedLastOpen()).toBe(T2);
	});

	it('persists the window records regardless of the gate (scroll-up path)', async () => {
		await seedSubscription(mockActiveDatabase, { rid: RID, lastOpen: new Date(T3) });
		answerHistoryOnce([historyMessage('h0', T0), historyMessage('h1', T1), historyMessage('h2', T2)]);

		await loadMessagesForRoom({ rid: RID, t: 'c', latest: new Date(T3) });

		// records land even though the cursor never advanced
		expect(await persistedMessageIds()).toEqual(['h0', 'h1', 'h2']);
		expect(await persistedLastOpen()).toBe(T3);
	});
});
