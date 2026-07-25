import { Q } from '@nozbe/watermelondb';

import type { TAppDatabase } from '../interfaces';
import type { IMessage, TMessageModel, TSubscriptionModel } from '../../../definitions';
import { closeLokiTestDatabase, createLokiTestDatabase, resetLokiTestDatabase, seedSubscription } from './lokiTestDatabase';
import { createFakeSyncServer, type IFakeServerMessage } from './fakeSyncServer';
import { MessageTypeLoad } from '../../constants/messageTypeLoad';
import sdk from '../../services/sdk';
import { loadMessagesForRoom } from '../../methods/loadMessagesForRoom';
import { loadMissedMessages } from '../../methods/loadMissedMessages';

// Real persistence + real cursor: `database.active` points at the live LokiJS DB so
// `loadMessagesForRoom` drives the real `updateMessages` (and therefore the real
// `buildMessage`/`normalizeMessage` in-place mutation) plus the real `advanceSyncCursor`.
// Only the outer edges are mocked: `sdk` (the *.history + chat.syncMessages network),
// `auxStore` (server version + settings + dispatch), `encryption` (pass-through), `log`.
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
			settings: { Hide_System_Messages: ['uj'] }
		}),
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

/** Structural shape of the `sdk.get` mock, so this file needn't depend on the `jest` mock types. */
type TSdkGetRouter = {
	mockImplementation: (handler: (endpoint: string, params: { type?: string; next?: number | null }) => unknown) => void;
};

const mockedSdkGet = sdk.get as jest.MockedFunction<typeof sdk.get>;
const server = createFakeSyncServer();

const RID = 'room-1';
const COUNT = 50;
// Deliberately years behind the device clock: any cursor stamped from `new Date()`
// lands unmistakably above every server timestamp in these fixtures.
const SERVER_EPOCH = Date.UTC(2020, 0, 1, 12, 0, 0);
const SEED_CURSOR = SERVER_EPOCH - 60_000;
const MISSED_TS = SERVER_EPOCH + 60_000;

const historyMessage = (id: string, ts: number, t?: string): IMessage =>
	({
		_id: id,
		rid: RID,
		msg: `msg-${id}`,
		ts: new Date(ts).toISOString(),
		_updatedAt: new Date(ts).toISOString(),
		u: { _id: 'user-1', username: 'user-1' },
		...(t && { t })
	} as unknown as IMessage);

const serverMessage = (id: string, updatedAt: number): IFakeServerMessage => ({
	_id: id,
	rid: RID,
	msg: `msg-${id}`,
	ts: new Date(updatedAt).toISOString(),
	_updatedAt: updatedAt
});

// Newest-first, exactly COUNT long: what the server returns when more history exists above.
const fullPage = (idPrefix: string, newest: number, hiddenType?: string): IMessage[] =>
	Array.from({ length: COUNT }, (_, index) => historyMessage(`${idPrefix}-${index}`, newest - index * 1000, hiddenType));

const historyPages: IMessage[][] = [];
const answerHistoryOnce = (messages: IMessage[]) => historyPages.push(messages);

// One router for both endpoints a room open hits: the *.history pages queued by the test,
// and the shared `chat.syncMessages` fake reading the cursor the history load left behind.
const installSdkRouter = () =>
	(mockedSdkGet as unknown as TSdkGetRouter).mockImplementation((endpoint, params) => {
		if (endpoint === 'chat.syncMessages') {
			return Promise.resolve(server.handleSyncMessages(params));
		}
		if (endpoint.endsWith('.history')) {
			return Promise.resolve({ success: true, messages: historyPages.shift() ?? [] });
		}
		throw new Error(`Unexpected endpoint ${endpoint}`);
	});

const newestUpdatedAt = (messages: IMessage[]): number =>
	messages.reduce((max, message) => Math.max(max, new Date(message._updatedAt).getTime()), 0);

const persistedMessageIds = async (): Promise<string[]> => {
	const rows = (await mockActiveDatabase.get('messages').query(Q.where('rid', RID)).fetch()) as TMessageModel[];
	return rows.map(row => row.id).sort();
};

const persistedLastOpen = async (rid = RID): Promise<number | undefined> => {
	const subscription = (await mockActiveDatabase.get('subscriptions').find(rid)) as TSubscriptionModel;
	return subscription.lastOpen?.getTime();
};

const persistedLoadMoreCount = async (): Promise<number> => {
	const rows = (await mockActiveDatabase
		.get('messages')
		.query(Q.where('rid', RID), Q.where('t', MessageTypeLoad.MORE))
		.fetch()) as TMessageModel[];
	return rows.length;
};

describe('sync cursor is never stamped from the device clock (LokiJS integration)', () => {
	beforeAll(() => {
		mockActiveDatabase = createLokiTestDatabase();
	});

	afterAll(() => closeLokiTestDatabase(mockActiveDatabase));

	beforeEach(async () => {
		await resetLokiTestDatabase(mockActiveDatabase);
		server.reset();
		historyPages.length = 0;
		mockedSdkGet.mockReset();
		installSdkRouter();
	});

	// The user-visible symptom of issue #7499: a full first history page appends a synthetic
	// load-more row to the array handed to advanceSyncCursor, normalizeMessage stamps that row's
	// missing `_updatedAt` with `new Date()`, and the next sync asks the server for changes
	// newer than the DEVICE clock — so everything the server wrote in between is skipped forever.
	it('delivers a message written after the history window but before the device clock', async () => {
		await seedSubscription(mockActiveDatabase, { rid: RID, lastOpen: new Date(SEED_CURSOR) });
		answerHistoryOnce(fullPage('m', SERVER_EPOCH));
		server.updated.push(serverMessage('missed-1', MISSED_TS));

		await loadMessagesForRoom({ rid: RID, t: 'c' });
		await loadMissedMessages({ rid: RID });

		expect(await persistedMessageIds()).toContain('missed-1');
		expect(await persistedLastOpen()).toBe(MISSED_TS);
	});

	it('advances the cursor to the newest server timestamp when the first history page is full', async () => {
		await seedSubscription(mockActiveDatabase, { rid: RID, lastOpen: new Date(SEED_CURSOR) });
		const page = fullPage('m', SERVER_EPOCH);
		answerHistoryOnce(page);

		await loadMessagesForRoom({ rid: RID, t: 'c' });

		// the synthetic loader really was inserted — this is the poisoning path, not a no-op
		expect(await persistedLoadMoreCount()).toBe(1);
		expect(await persistedLastOpen()).toBe(newestUpdatedAt(page));
	});

	it('advances the cursor to the server max on a partial page', async () => {
		await seedSubscription(mockActiveDatabase, { rid: RID, lastOpen: new Date(SEED_CURSOR) });
		const page = [historyMessage('m1', SERVER_EPOCH - 2000), historyMessage('m2', SERVER_EPOCH)];
		answerHistoryOnce(page);

		await loadMessagesForRoom({ rid: RID, t: 'c' });

		expect(await persistedLoadMoreCount()).toBe(0);
		expect(await persistedLastOpen()).toBe(newestUpdatedAt(page));
	});

	it('advances to the server max when a full page is followed by a partial one', async () => {
		await seedSubscription(mockActiveDatabase, { rid: RID, lastOpen: new Date(SEED_CURSOR) });
		// every message in the first page is a hidden system message, so the loader recurses
		const hiddenPage = fullPage('hidden', SERVER_EPOCH, 'uj');
		const tailPage = [historyMessage('tail-1', SERVER_EPOCH - COUNT * 1000)];
		answerHistoryOnce(hiddenPage);
		answerHistoryOnce(tailPage);

		await loadMessagesForRoom({ rid: RID, t: 'c' });

		expect(await persistedLastOpen()).toBe(newestUpdatedAt([...hiddenPage, ...tailPage]));
	});
});
