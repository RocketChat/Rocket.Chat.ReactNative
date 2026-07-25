import type { TAppDatabase } from '../interfaces';
import {
	closeLokiTestDatabase,
	createLokiTestDatabase,
	resetLokiTestDatabase,
	seedSubscription,
	seedMessage
} from './lokiTestDatabase';
import { createFakeSyncServer } from './fakeSyncServer';

describe('lokiTestDatabase harness', () => {
	let database: TAppDatabase;

	beforeEach(async () => {
		if (!database) {
			database = createLokiTestDatabase();
		}
		await resetLokiTestDatabase(database);
	});

	afterAll(() => closeLokiTestDatabase(database));

	it('round-trips a subscription and a message through a real db.write + query', async () => {
		const T0 = Date.UTC(2026, 6, 22, 12, 0, 0);
		await seedSubscription(database, { rid: 'room-1', name: 'general', lastOpen: new Date(T0) });
		await seedMessage(database, {
			id: 'message-1',
			rid: 'room-1',
			msg: 'hello world',
			ts: new Date(T0 + 1000),
			u: { _id: 'user-1', username: 'rocket.cat' }
		});

		const subscriptions = await database.get('subscriptions').query().fetch();
		expect(subscriptions).toHaveLength(1);
		expect(subscriptions[0].rid).toBe('room-1');
		expect(subscriptions[0].name).toBe('general');
		expect(subscriptions[0].lastOpen?.getTime()).toBe(T0);

		const messages = await database.get('messages').query().fetch();
		expect(messages).toHaveLength(1);
		expect(messages[0].id).toBe('message-1');
		expect(messages[0].msg).toBe('hello world');
		expect(messages[0].subscription?.id).toBe('room-1');
		expect(messages[0].u).toEqual({ _id: 'user-1', username: 'rocket.cat' });
	});

	it('resets between tests: previous records are gone', async () => {
		const count = await database.get('messages').query().fetchCount();
		expect(count).toBe(0);
	});

	it('serves paginated chat.syncMessages from the fake server', () => {
		const server = createFakeSyncServer({ deletedPageSize: 2 });
		const T0 = Date.UTC(2026, 6, 22, 12, 0, 0);
		server.deleted.push(
			{ _id: 'deleted-1', _deletedAt: T0 + 10_000 },
			{ _id: 'deleted-2', _deletedAt: T0 + 20_000 },
			{ _id: 'deleted-3', _deletedAt: T0 + 30_000 }
		);

		const firstPage = server.handleSyncMessages({ type: 'DELETED', next: T0 });
		expect(firstPage.result.deleted?.map(message => message._id)).toEqual(['deleted-1', 'deleted-2']);
		expect(firstPage.result.cursor.next).toBe(T0 + 20_000);

		const secondPage = server.handleSyncMessages({ type: 'DELETED', next: firstPage.result.cursor.next });
		expect(secondPage.result.deleted?.map(message => message._id)).toEqual(['deleted-3']);
		expect(secondPage.result.cursor.next).toBeNull();
	});
});
