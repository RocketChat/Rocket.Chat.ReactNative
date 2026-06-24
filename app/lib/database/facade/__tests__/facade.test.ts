/**
 * Facade pure-logic tests — L1 (Jest, no native bridge).
 *
 * Covers the logic that does NOT touch expo-sqlite at runtime:
 *  - sanitizedRaw / setRawCoerced coercion + id generation + no _status/_changed
 *  - decorator round-trips (@field, @date, @json, @readonly) matching WMDB semantics
 *  - Q clause descriptors → Drizzle SQL translation (where/orderBy/limit/offset)
 *  - WriterQueue serialization (single-writer discipline)
 *
 * The native I/O surface (Collection fetch, Database.batch, RxJS observe) is exercised
 * by the on-device smoke test, not here.
 */

import { drizzle } from 'drizzle-orm/sqlite-proxy';

// observe.ts imports expo-sqlite at module top; Model/decorators pull it in transitively.
jest.mock('expo-sqlite', () => ({
	addDatabaseChangeListener: jest.fn(() => ({ remove: jest.fn() }))
}));

import { sanitizedRaw, setRawCoerced, tableSchema, randomId, type TableSchema, type RawRecord } from '../schema';
import { Model, type ICollection } from '../Model';
import { field, date, json, readonly } from '../decorators';
import * as Q from '../Q';
import { translateClauses } from '../translate';
import { WriterQueue } from '../writer';
import { subscriptionsTable } from '../../driver/schema/app';

// ---------------------------------------------------------------------------
// Shared test schema
// ---------------------------------------------------------------------------

const testSchema: TableSchema = tableSchema({
	name: 'things',
	columns: [
		{ name: 'name', type: 'string' },
		{ name: 'nick', type: 'string', isOptional: true },
		{ name: 'open', type: 'boolean' },
		{ name: 'flag', type: 'boolean', isOptional: true },
		{ name: 'count', type: 'number' },
		{ name: 'score', type: 'number', isOptional: true }
	]
});

function makeCollection(schema: TableSchema): ICollection {
	return { table: schema.name, schema } as unknown as ICollection;
}

// ---------------------------------------------------------------------------
// sanitizedRaw / setRawCoerced
// ---------------------------------------------------------------------------

describe('sanitizedRaw', () => {
	it('generates a 16-char lowercase-alphanumeric id when none is provided', () => {
		const raw = sanitizedRaw({}, testSchema);
		expect(typeof raw.id).toBe('string');
		expect(raw.id as string).toMatch(/^[a-z0-9]{16}$/);
	});

	it('keeps a provided string id', () => {
		const raw = sanitizedRaw({ id: 'abc123' }, testSchema);
		expect(raw.id).toBe('abc123');
	});

	it('generates an id when dirtyRaw.id is not a string', () => {
		const raw = sanitizedRaw({ id: 42 as unknown as string }, testSchema);
		expect(raw.id as string).toMatch(/^[a-z0-9]{16}$/);
	});

	it('never emits _status or _changed (Drizzle has no such columns)', () => {
		const raw = sanitizedRaw({ _status: 'created', _changed: 'name', name: 'x' }, testSchema);
		expect(raw).not.toHaveProperty('_status');
		expect(raw).not.toHaveProperty('_changed');
	});

	it('emits exactly id + every schema column and nothing else', () => {
		const raw = sanitizedRaw({ extra: 'ignored' }, testSchema);
		expect(Object.keys(raw).sort()).toEqual(['count', 'flag', 'id', 'name', 'nick', 'open', 'score'].sort());
	});

	it('coerces missing required columns to type zero-values', () => {
		const raw = sanitizedRaw({}, testSchema);
		expect(raw.name).toBe('');
		expect(raw.open).toBe(false);
		expect(raw.count).toBe(0);
	});

	it('coerces missing optional columns to null', () => {
		const raw = sanitizedRaw({}, testSchema);
		expect(raw.nick).toBeNull();
		expect(raw.flag).toBeNull();
		expect(raw.score).toBeNull();
	});

	it('generates distinct ids across calls', () => {
		const ids = new Set(Array.from({ length: 50 }, () => randomId()));
		expect(ids.size).toBe(50);
	});
});

describe('setRawCoerced', () => {
	const raw: RawRecord = {};
	const col = (over: Partial<{ type: 'string' | 'boolean' | 'number'; isOptional: boolean }>) => ({
		name: 'c',
		type: 'string' as const,
		...over
	});

	it('string: keeps strings, blanks non-strings (required), nulls non-strings (optional)', () => {
		setRawCoerced(raw, 'c', 'hi', col({ type: 'string' }));
		expect(raw.c).toBe('hi');
		setRawCoerced(raw, 'c', 5, col({ type: 'string' }));
		expect(raw.c).toBe('');
		setRawCoerced(raw, 'c', 5, col({ type: 'string', isOptional: true }));
		expect(raw.c).toBeNull();
	});

	it('boolean: keeps booleans, maps 1/0, else false/null', () => {
		setRawCoerced(raw, 'c', true, col({ type: 'boolean' }));
		expect(raw.c).toBe(true);
		setRawCoerced(raw, 'c', 1, col({ type: 'boolean' }));
		expect(raw.c).toBe(true);
		setRawCoerced(raw, 'c', 0, col({ type: 'boolean' }));
		expect(raw.c).toBe(false);
		setRawCoerced(raw, 'c', 'x', col({ type: 'boolean' }));
		expect(raw.c).toBe(false);
		setRawCoerced(raw, 'c', 'x', col({ type: 'boolean', isOptional: true }));
		expect(raw.c).toBeNull();
	});

	it('number: keeps finite numbers, zeroes/nulls NaN and Infinity', () => {
		setRawCoerced(raw, 'c', 7, col({ type: 'number' }));
		expect(raw.c).toBe(7);
		setRawCoerced(raw, 'c', NaN, col({ type: 'number' }));
		expect(raw.c).toBe(0);
		setRawCoerced(raw, 'c', Infinity, col({ type: 'number' }));
		expect(raw.c).toBe(0);
		setRawCoerced(raw, 'c', NaN, col({ type: 'number', isOptional: true }));
		expect(raw.c).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// Decorators
// ---------------------------------------------------------------------------

const passthrough = (v: unknown) => v;

class Thing extends Model {
	@field('name') name!: string;

	@date('ts') ts!: Date | null;

	@json('meta', passthrough) meta!: unknown;
}

const thingSchema: TableSchema = tableSchema({
	name: 'thing',
	columns: [
		{ name: 'name', type: 'string' },
		{ name: 'ts', type: 'number', isOptional: true },
		{ name: 'meta', type: 'string', isOptional: true },
		{ name: 'frozen', type: 'string' }
	]
});

function newThing(raw: RawRecord = {}): Thing {
	return new Thing(makeCollection(thingSchema), sanitizedRaw(raw, thingSchema));
}

describe('@field', () => {
	it('reads and writes the raw column', () => {
		const t = newThing();
		t.name = 'hello';
		expect(t.name).toBe('hello');
		expect(t._raw.name).toBe('hello');
	});

	it('coerces on write via _setRaw', () => {
		const t = newThing();
		(t as unknown as { name: unknown }).name = 123;
		expect(t.name).toBe(''); // required string, non-string -> ''
	});
});

describe('@date', () => {
	it('stores ms on set and returns a Date on get', () => {
		const t = newThing();
		const d = new Date('2024-01-02T03:04:05.000Z');
		t.ts = d;
		expect(t._raw.ts).toBe(+d);
		expect(t.ts).toBeInstanceOf(Date);
		expect((t.ts as Date).getTime()).toBe(+d);
	});

	it('returns null when raw is null', () => {
		const t = newThing();
		t.ts = null;
		expect(t._raw.ts).toBeNull();
		expect(t.ts).toBeNull();
	});

	it('memoizes the Date instance across repeated gets', () => {
		const t = newThing({ ts: 1700000000000 });
		expect(t.ts).toBe(t.ts);
	});
});

describe('@json', () => {
	it('stringifies on set and parses+sanitizes on get', () => {
		const t = newThing();
		t.meta = { a: 1, b: ['x'] };
		expect(typeof t._raw.meta).toBe('string');
		expect(t.meta).toEqual({ a: 1, b: ['x'] });
	});

	it('writes null when the sanitized value is null/undefined', () => {
		const t = newThing();
		t.meta = null;
		expect(t._raw.meta).toBeNull();
	});

	it('returns undefined for empty/invalid raw json', () => {
		const t = newThing({ meta: '' });
		expect(t.meta).toBeUndefined();
		t._raw.meta = 'not-json';
		expect(t.meta).toBeUndefined();
	});
});

describe('@readonly', () => {
	// Stacked decorator syntax (@readonly @field) can't be expressed in a .ts test — TS types
	// property decorators without a descriptor param. Compose the descriptors as babel does at runtime.
	it('wraps the underlying setter to throw while keeping the getter', () => {
		const base = field('frozen')(Thing.prototype, 'frozen');
		const desc = readonly(Thing.prototype, 'frozen', base);
		const obj = new Thing(makeCollection(thingSchema), sanitizedRaw({ frozen: 'locked' }, thingSchema));
		Object.defineProperty(obj, 'frozen', desc);
		expect((obj as unknown as { frozen: string }).frozen).toBe('locked');
		expect(() => {
			(obj as unknown as { frozen: string }).frozen = 'changed';
		}).toThrow(/@readonly/);
	});
});

// ---------------------------------------------------------------------------
// Q -> Drizzle translation
// ---------------------------------------------------------------------------

describe('translateClauses', () => {
	const proxyDb = drizzle(async () => ({ rows: [] }));

	const buildSql = (clauses: Q.Clause[]) => {
		const { where, orderBy, limit, offset } = translateClauses(clauses, subscriptionsTable);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let q: any = proxyDb.select().from(subscriptionsTable);
		if (where) q = q.where(where);
		if (orderBy.length) q = q.orderBy(...orderBy);
		if (limit !== undefined) q = q.limit(limit);
		if (offset !== undefined) q = q.offset(offset);
		return q.toSQL();
	};

	it('translates where(eq)', () => {
		const { sql, params } = buildSql([Q.where('rid', 'GENERAL')]);
		expect(sql).toContain('where "subscriptions"."rid" = ?');
		expect(params).toEqual(['GENERAL']);
	});

	it('translates and() of multiple wheres', () => {
		const { sql } = buildSql([Q.and(Q.where('open', true), Q.where('archived', false))]);
		expect(sql).toContain('"subscriptions"."open" = ?');
		expect(sql).toContain('"subscriptions"."archived" = ?');
		expect(sql).toContain(' and ');
	});

	it('translates or()', () => {
		const { sql } = buildSql([Q.or(Q.where('t', 'c'), Q.where('t', 'p'))]);
		expect(sql).toContain(' or ');
	});

	it('translates where(oneOf) -> IN', () => {
		const { sql, params } = buildSql([Q.where('rid', Q.oneOf(['a', 'b', 'c']))]);
		expect(sql).toContain(' in (?, ?, ?)');
		expect(params).toEqual(['a', 'b', 'c']);
	});

	it('translates where(notEq), where(gt), where(lte), where(like), where(notLike)', () => {
		expect(buildSql([Q.where('t', Q.notEq('d'))]).sql).toContain('<>');
		expect(buildSql([Q.where('unread', Q.gt(0))]).sql).toContain('>');
		expect(buildSql([Q.where('unread', Q.lte(5))]).sql).toContain('<=');
		expect(buildSql([Q.where('name', Q.like('%x%'))]).sql).toContain('like');
		expect(buildSql([Q.where('name', Q.notLike('%x%'))]).sql).toContain('not ');
	});

	it('lowers a null comparison to IS NULL / IS NOT NULL', () => {
		expect(buildSql([Q.where('rid', null)]).sql).toContain('is null');
		expect(buildSql([Q.where('rid', Q.notEq(null))]).sql).toContain('is not null');
	});

	it('translates sortBy asc/desc into order by', () => {
		expect(buildSql([Q.sortBy('room_updated_at', Q.desc)]).sql).toContain('order by "subscriptions"."room_updated_at" desc');
		expect(buildSql([Q.sortBy('name', Q.asc)]).sql).toContain('order by "subscriptions"."name" asc');
	});

	it('translates take/skip into limit/offset', () => {
		const { sql, params } = buildSql([Q.take(10), Q.skip(20)]);
		expect(sql).toContain('limit ?');
		expect(sql).toContain('offset ?');
		expect(params).toEqual(expect.arrayContaining([10, 20]));
	});

	it('combines where + order + limit in one query', () => {
		const { sql } = buildSql([Q.where('open', true), Q.sortBy('room_updated_at', Q.desc), Q.take(50)]);
		expect(sql).toContain('where');
		expect(sql).toContain('order by');
		expect(sql).toContain('limit');
	});

	it('throws on an unknown column', () => {
		expect(() => buildSql([Q.where('not_a_column', 1)])).toThrow(/not found/);
	});
});

// ---------------------------------------------------------------------------
// WriterQueue
// ---------------------------------------------------------------------------

describe('WriterQueue', () => {
	it('runs enqueued writers one at a time, in order', async () => {
		const queue = new WriterQueue();
		const events: string[] = [];

		const p1 = queue.enqueue(async () => {
			events.push('start-1');
			await new Promise(r => setTimeout(r, 20));
			events.push('end-1');
			return 1;
		});
		const p2 = queue.enqueue(async () => {
			events.push('start-2');
			return 2;
		});

		const [r1, r2] = await Promise.all([p1, p2]);
		expect(r1).toBe(1);
		expect(r2).toBe(2);
		// start-2 must come after end-1 (serialized, not interleaved)
		expect(events).toEqual(['start-1', 'end-1', 'start-2']);
	});

	it('keeps the queue alive after a writer rejects', async () => {
		const queue = new WriterQueue();
		await expect(queue.enqueue(async () => Promise.reject(new Error('boom')))).rejects.toThrow('boom');
		await expect(queue.enqueue(async () => 'ok')).resolves.toBe('ok');
	});

	it('propagates the resolved value to the caller', async () => {
		const queue = new WriterQueue();
		await expect(queue.enqueue(async () => 'value')).resolves.toBe('value');
	});

	it('runs a re-entrant enqueue inline instead of deadlocking', async () => {
		// The WMDB write idiom is db.write(() => collection.create()), and create()/update() themselves
		// call db.write(). The inner enqueue must run inline within the outer writer — enqueuing it behind
		// the outer one deadlocks, since the outer fn awaits the inner, which can't run until the outer ends.
		const queue = new WriterQueue();
		const order: string[] = [];

		const work = queue.enqueue(async () => {
			order.push('outer-start');
			const inner = await queue.enqueue(async () => {
				order.push('inner');
				return 'inner-result';
			});
			order.push('outer-end');
			return inner;
		});
		const timeout = new Promise<never>((_, reject) => {
			setTimeout(() => reject(new Error('re-entrant write deadlocked')), 200);
		});

		await expect(Promise.race([work, timeout])).resolves.toBe('inner-result');
		expect(order).toEqual(['outer-start', 'inner', 'outer-end']);
	});

	it('resumes queued writers after a re-entrant writer completes', async () => {
		const queue = new WriterQueue();
		const order: string[] = [];

		const outer = queue.enqueue(async () => {
			order.push('outer-start');
			await queue.enqueue(async () => {
				order.push('inner');
			});
			order.push('outer-end');
		});
		const next = queue.enqueue(async () => {
			order.push('next');
		});

		await Promise.all([outer, next]);
		expect(order).toEqual(['outer-start', 'inner', 'outer-end', 'next']);
	});
});
