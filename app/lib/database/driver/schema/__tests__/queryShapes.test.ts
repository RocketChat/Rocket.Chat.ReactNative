import { and, asc, desc, eq, gt, inArray, isNull, like, lt, or } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/sqlite-proxy';

import {
	customEmojisTable,
	messagesTable,
	permissionsTable,
	subscriptionsTable,
	threadMessagesTable,
	threadsTable,
	usersAppTable
} from '../app';

const db = drizzle(async () => ({ rows: [] }));

describe('Drizzle query shapes', () => {
	it('builds the room-list subscriptions query (app/views/RoomsListView/hooks/useSubscriptions.ts)', () => {
		const q = db
			.select()
			.from(subscriptionsTable)
			.where(and(eq(subscriptionsTable.archived, false), eq(subscriptionsTable.open, true)))
			.orderBy(desc(subscriptionsTable.room_updated_at));

		const { sql, params } = q.toSQL();
		expect(sql).toContain('from "subscriptions"');
		expect(sql).toContain('"archived" = ?');
		expect(sql).toContain('"open" = ?');
		expect(sql).toContain('order by "subscriptions"."room_updated_at" desc');
		expect(params).toHaveLength(2);
	});

	it('builds the alphabetical room-list subscriptions query (app/views/RoomsListView/hooks/useSubscriptions.ts)', () => {
		const q = db
			.select()
			.from(subscriptionsTable)
			.where(and(eq(subscriptionsTable.archived, false), eq(subscriptionsTable.open, true)))
			.orderBy(asc(subscriptionsTable.fname));

		const { sql } = q.toSQL();
		expect(sql).toContain('order by "subscriptions"."fname" asc');
	});

	it('builds the subscription search query with Q.or across name/fname/sanitized_fname (app/lib/methods/search.ts)', () => {
		const likeString = 'test';
		const q = db
			.select()
			.from(subscriptionsTable)
			.where(
				or(
					like(subscriptionsTable.sanitized_fname, `%${likeString}%`),
					like(subscriptionsTable.name, `%${likeString}%`),
					like(subscriptionsTable.fname, `%${likeString}%`)
				)
			)
			.orderBy(desc(subscriptionsTable.room_updated_at));

		const { sql, params } = q.toSQL();
		expect(sql).toContain('from "subscriptions"');
		expect(sql).toContain('"sanitized_fname" like ?');
		expect(sql).toContain('"name" like ?');
		expect(sql).toContain('"fname" like ?');
		expect(sql).toContain('order by "subscriptions"."room_updated_at" desc');
		expect(params).toEqual(['%test%', '%test%', '%test%']);
	});

	it('builds the messages query for deleteMessageBulk with rid + ts range (app/lib/methods/subscriptions/room.ts)', () => {
		const rid = 'GENERAL';

		const { sql: sqlBase } = db.select().from(messagesTable).where(eq(messagesTable.rid, rid)).toSQL();
		expect(sqlBase).toContain('"rid" = ?');

		const tsGt = 1700000000000;
		const tsLt = 1700000100000;
		const { sql: sqlRange, params: rangeParams } = db
			.select()
			.from(messagesTable)
			.where(and(eq(messagesTable.rid, rid), gt(messagesTable.ts, tsGt), lt(messagesTable.ts, tsLt)))
			.toSQL();
		expect(sqlRange).toContain('from "messages"');
		expect(sqlRange).toContain('"ts" > ?');
		expect(sqlRange).toContain('"ts" < ?');
		expect(rangeParams).toEqual([rid, tsGt, tsLt]);

		// pinned exclusion variation (Q.or(pinned=false, pinned=null))
		const { sql: sqlPinned } = db
			.select()
			.from(messagesTable)
			.where(and(eq(messagesTable.rid, rid), or(eq(messagesTable.pinned, false), isNull(messagesTable.pinned))))
			.toSQL();
		expect(sqlPinned).toContain('"pinned" = ?');
		expect(sqlPinned).toContain('"pinned" is null');
	});

	it('builds the messages by id list (updateMessages / Q.oneOf) (app/lib/methods/updateMessages.ts)', () => {
		const rid = 'GENERAL';
		const ids = ['msg1', 'msg2', 'msg3'];

		const q = db
			.select()
			.from(messagesTable)
			.where(and(eq(messagesTable.rid, rid), inArray(messagesTable.id, ids)));

		const { sql, params } = q.toSQL();
		expect(sql).toContain('"rid" = ?');
		expect(sql).toContain('"id" in (?, ?, ?)');
		expect(params).toContain('GENERAL');
		expect(params).toContain('msg1');
	});

	it('builds the thread messages query by rid (app/lib/methods/loadThreadMessages.ts)', () => {
		const tmid = 'THREAD_ID';
		const q = db.select().from(threadMessagesTable).where(eq(threadMessagesTable.rid, tmid));

		const { sql, params } = q.toSQL();
		expect(sql).toContain('from "thread_messages"');
		expect(sql).toContain('"rid" = ?');
		expect(params).toEqual([tmid]);
	});

	it('builds the threads query by rid sorted by tlm (app/views/ThreadMessagesView/index.tsx)', () => {
		const rid = 'GENERAL';
		const keyword = 'hello';

		const q = db
			.select()
			.from(threadsTable)
			.where(and(eq(threadsTable.rid, rid), like(threadsTable.msg, `%${keyword}%`)))
			.orderBy(desc(threadsTable.tlm));

		const { sql, params } = q.toSQL();
		expect(sql).toContain('from "threads"');
		expect(sql).toContain('"rid" = ?');
		expect(sql).toContain('"msg" like ?');
		expect(sql).toContain('order by "threads"."tlm" desc');
		expect(params).toContain('GENERAL');
		expect(params).toContain('%hello%');
	});

	it('builds the custom emojis search query (app/lib/methods/emojis.ts)', () => {
		const keyword = 'smile';
		const q = db.select().from(customEmojisTable).where(like(customEmojisTable.name, `%${keyword}%`));

		const { sql, params } = q.toSQL();
		expect(sql).toContain('from "custom_emojis"');
		expect(sql).toContain('"name" like ?');
		expect(params).toEqual(['%smile%']);
	});

	it('builds the users lookup by _id index column (app schema) (app/lib/database/schema/app.js)', () => {
		const userId = 'user123';
		const q = db.select().from(usersAppTable).where(eq(usersAppTable._id, userId));

		const { sql, params } = q.toSQL();
		expect(sql).toContain('from "users"');
		expect(sql).toContain('"_id" = ?');
		expect(params).toEqual([userId]);
	});

	it('builds the permissions fetch by id list (app/lib/methods/getPermissions.ts)', () => {
		const ids = ['create-c', 'delete-message', 'view-room-administration'];
		const q = db.select().from(permissionsTable).where(inArray(permissionsTable.id, ids));

		const { sql, params } = q.toSQL();
		expect(sql).toContain('from "permissions"');
		expect(sql).toContain('"id" in (?, ?, ?)');
		expect(params).toEqual(ids);
	});
});
