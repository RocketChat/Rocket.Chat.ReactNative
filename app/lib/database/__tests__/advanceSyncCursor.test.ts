import type { IMessage, TSubscriptionModel } from '../../../definitions';
import type { TAppDatabase } from '../interfaces';
import { advanceSyncCursor } from '../../methods/helpers/advanceSyncCursor';
import log from '../../methods/helpers/log';
import {
	closeLokiTestDatabase,
	createLokiTestDatabase,
	resetLokiTestDatabase,
	seedSubscription,
	withWriterQueueDiagnosticCleared
} from './lokiTestDatabase';

// The real `advanceSyncCursor` reads `database.active` (via itself and via the real
// `getSubscriptionByRoomId` service). Point both at the live LokiJS database so the
// forward-only cursor and the re-read-inside-write guard run against the real WMDB
// writer lock — the behavior the `database.active` object-mock cannot prove.
let mockActiveDatabase: TAppDatabase;
jest.mock('../../database', () => ({
	__esModule: true,
	default: {
		get active() {
			return mockActiveDatabase;
		}
	}
}));

jest.mock('../../methods/helpers/log', () => ({
	__esModule: true,
	default: jest.fn()
}));

const mockedLog = log as jest.MockedFunction<typeof log>;

const RID = 'room-1';
const T0 = Date.UTC(2026, 6, 22, 12, 0, 0);
const T1 = T0 + 1000;
const T2 = T0 + 2000;
const T3 = T0 + 3000;
const T5 = T0 + 5000;

const message = (updatedAt?: number): IMessage =>
	({ _updatedAt: updatedAt === undefined ? undefined : new Date(updatedAt) } as unknown as IMessage);

const flush = () => new Promise<void>(resolve => setImmediate(resolve));

const persistedLastOpen = async (rid = RID): Promise<number | undefined> => {
	const subscription = (await mockActiveDatabase.get('subscriptions').find(rid)) as TSubscriptionModel;
	return subscription.lastOpen?.getTime();
};

describe('advanceSyncCursor (LokiJS integration)', () => {
	beforeAll(() => {
		mockActiveDatabase = createLokiTestDatabase();
	});

	afterAll(() => closeLokiTestDatabase(mockActiveDatabase));

	beforeEach(async () => {
		await resetLokiTestDatabase(mockActiveDatabase);
		mockedLog.mockClear();
	});

	it('advances lastOpen to the max _updatedAt of an out-of-order batch', async () => {
		await seedSubscription(mockActiveDatabase, { rid: RID, lastOpen: new Date(T0) });

		await advanceSyncCursor(RID, [message(T1), message(T3), message(T2)]);

		expect(await persistedLastOpen()).toBe(T3);
	});

	it('is forward-only: a batch older than the cursor is a no-op', async () => {
		await seedSubscription(mockActiveDatabase, { rid: RID, lastOpen: new Date(T5) });

		await advanceSyncCursor(RID, [message(T2)]);

		expect(await persistedLastOpen()).toBe(T5);
	});

	it('is forward-only: latest equal to the cursor is a no-op', async () => {
		await seedSubscription(mockActiveDatabase, { rid: RID, lastOpen: new Date(T3) });

		await advanceSyncCursor(RID, [message(T3)]);

		expect(await persistedLastOpen()).toBe(T3);
	});

	it('never advances past an empty batch', async () => {
		await seedSubscription(mockActiveDatabase, { rid: RID, lastOpen: new Date(T2) });

		await advanceSyncCursor(RID, []);

		expect(await persistedLastOpen()).toBe(T2);
	});

	it('never advances when every message is missing _updatedAt', async () => {
		await seedSubscription(mockActiveDatabase, { rid: RID, lastOpen: new Date(T2) });

		await advanceSyncCursor(RID, [message(undefined), message(undefined)]);

		expect(await persistedLastOpen()).toBe(T2);
	});

	it('skips messages missing _updatedAt without poisoning the max', async () => {
		await seedSubscription(mockActiveDatabase, { rid: RID, lastOpen: new Date(T0) });

		await advanceSyncCursor(RID, [message(undefined), message(T3), message(undefined)]);

		expect(await persistedLastOpen()).toBe(T3);
	});

	// There is nowhere to persist a cursor without a row, so the no-op stands. What must not be
	// lost is the batch itself — `nullCursorRecurrence.integration.test.ts` covers the recovery,
	// where the row lands cursor-less and the next sync re-delivers off `ls`/`ts`.
	it('returns cleanly when no subscription exists for the rid', async () => {
		await expect(advanceSyncCursor('missing-room', [message(T3)])).resolves.toBeUndefined();

		const count = await mockActiveDatabase.get('subscriptions').query().fetchCount();
		expect(count).toBe(0);
		expect(mockedLog).not.toHaveBeenCalled();
	});

	it('re-read guard: a concurrent higher cursor is not regressed by an in-flight lower advance', async () => {
		await seedSubscription(mockActiveDatabase, { rid: RID, lastOpen: new Date(T0) });
		const subscription = (await mockActiveDatabase.get('subscriptions').find(RID)) as TSubscriptionModel;

		// A concurrent sync holds the writer lock and, once released, commits the higher T3.
		let openGate: () => void = () => {};
		const gate = new Promise<void>(resolve => {
			openGate = resolve;
		});
		let signalInside: () => void = () => {};
		const insideWriteLock = new Promise<void>(resolve => {
			signalInside = resolve;
		});
		const concurrentAdvance = mockActiveDatabase.write(async () => {
			signalInside();
			await gate;
			await subscription.update((s: TSubscriptionModel) => {
				s.lastOpen = new Date(T3);
			});
		});

		await insideWriteLock;

		// advanceSyncCursor reads the cursor still at T0 (reads don't take the writer lock),
		// passes the forward-only gate, then queues its own db.write behind the concurrent one.
		// Queueing behind a running writer arms WatermelonDB's dev-only ~1.5s diagnostic timer,
		// which would outlive Jest's exit window — clear it around the contended section.
		await withWriterQueueDiagnosticCleared(async () => {
			const inFlightAdvance = advanceSyncCursor(RID, [message(T2)]);
			await flush();

			// Release the concurrent write: it commits T3 first, then the in-flight write body runs,
			// re-reads the now-committed T3, and must skip its stale T2 rather than regress the cursor.
			openGate();
			await Promise.all([concurrentAdvance, inFlightAdvance]);
		});

		expect(await persistedLastOpen()).toBe(T3);
	});

	it('swallows and logs a thrown db error instead of propagating', async () => {
		await seedSubscription(mockActiveDatabase, { rid: RID, lastOpen: new Date(T0) });
		const error = new Error('boom');
		const writeSpy = jest.spyOn(mockActiveDatabase, 'write').mockRejectedValueOnce(error);

		await expect(advanceSyncCursor(RID, [message(T3)])).resolves.toBeUndefined();

		expect(mockedLog).toHaveBeenCalledWith(error);
		expect(await persistedLastOpen()).toBe(T0);
		writeSpy.mockRestore();
	});
});
