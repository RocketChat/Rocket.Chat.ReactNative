/**
 * Collection — facade over a single Drizzle table.
 * Exposes query/find/create/prepareCreate, matching the WMDB Collection API.
 */

import type { Observable } from 'rxjs';
import { eq, sql, getTableColumns } from 'drizzle-orm';
import type { SQLiteTable } from 'drizzle-orm/sqlite-core';

import type { DbHandle } from '../driver/connection';
import type { Database } from './Database';
import type { TableSchema, RawRecord } from './schema';
import { sanitizedRaw } from './schema';
import { type Model } from './Model';
import { Query } from './Query';
import type * as Q from './Q';
import { translateClauses } from './translate';
import { observeTable, observeTableWithColumns } from './observe';

export class Collection<M extends Model = Model> {
	readonly table: string;
	readonly schema: TableSchema;
	readonly _handle: DbHandle;
	// Back-ref to the Database, set after construction to avoid circular import ordering issues
	_db!: Database;

	/** The Drizzle table object for this collection. */
	private _drizzleTable: SQLiteTable;

	/** Model constructor for this collection. */
	private _ModelClass: new (col: Collection<M>, raw: RawRecord) => M;

	constructor(
		table: string,
		schema: TableSchema,
		drizzleTable: SQLiteTable,
		handle: DbHandle,
		ModelClass: new (col: Collection<M>, raw: RawRecord) => M
	) {
		this.table = table;
		this.schema = schema;
		this._drizzleTable = drizzleTable;
		this._handle = handle;
		this._ModelClass = ModelClass;
	}

	/** Wraps this Collection as the ICollection interface Model expects. */
	get _collection(): Collection<M> {
		return this;
	}

	// ---------------------------------------------------------------------------
	// Internal fetch helpers (synchronous — Drizzle expo-sqlite is sync)
	// ---------------------------------------------------------------------------

	/** Synchronous full fetch — used by observe and find. */
	_fetchSync(filter?: Record<string, unknown>): M[] {
		const { db } = this._handle;
		const columns = getTableColumns(this._drizzleTable);
		let q = db.select().from(this._drizzleTable as never);
		if (filter?.id) {
			const idCol = columns.id;
			if (idCol) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				q = (q as any).where(eq(idCol, filter.id));
			}
		}
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const rows: RawRecord[] = (q as any).all() as RawRecord[];
		return rows.map(raw => new this._ModelClass(this, raw));
	}

	/** Synchronous fetch with clauses. */
	_fetchAll(clauses: Q.Clause[]): M[] {
		const { where, orderBy, limit, offset } = translateClauses(clauses, this._drizzleTable);
		const { db } = this._handle;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let q: any = db.select().from(this._drizzleTable as never);
		if (where) q = q.where(where);
		if (orderBy.length > 0) q = q.orderBy(...orderBy);
		if (limit !== undefined) q = q.limit(limit);
		if (offset !== undefined) q = q.offset(offset);
		const rows: RawRecord[] = q.all() as RawRecord[];
		return rows.map(raw => new this._ModelClass(this, raw));
	}

	/** Synchronous count with clauses. */
	_fetchCount(clauses: Q.Clause[]): number {
		const { where } = translateClauses(clauses, this._drizzleTable);
		const { db } = this._handle;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let q: any = db.select({ c: sql<number>`count(*)` }).from(this._drizzleTable as never);
		if (where) q = q.where(where);
		const rows = q.all() as { c: number }[];
		return Number(rows[0]?.c ?? 0);
	}

	_observe(clauses: Q.Clause[]): Observable<M[]> {
		return observeTable(this._handle, this.table, () => this._fetchAll(clauses)) as unknown as Observable<M[]>;
	}

	_observeWithColumns(clauses: Q.Clause[], cols: string[]): Observable<M[]> {
		return observeTableWithColumns(this._handle, this.table, cols, () => this._fetchAll(clauses)) as unknown as Observable<M[]>;
	}

	// ---------------------------------------------------------------------------
	// Public API
	// ---------------------------------------------------------------------------

	/** Build a Query for this collection. */
	query(...clauses: Q.Clause[]): Query<M> {
		return new Query<M>(this, clauses);
	}

	/** Find a record by id. Rejects when missing (WMDB parity). */
	find(id: string): Promise<M> {
		const rows = this._fetchSync({ id });
		if (rows.length === 0) {
			return Promise.reject(new Error(`Record not found in '${this.table}' with id '${id}'`));
		}
		return Promise.resolve(rows[0]);
	}

	/** Prepare a new record without persisting it. Tag _pendingOp = 'create'. */
	prepareCreate(fn: (record: M) => void): M {
		// Start with a raw where id will be set by the fn or sanitizedRaw
		const raw = sanitizedRaw({}, this.schema);
		const model = new this._ModelClass(this, raw);
		model._pendingOp = 'create';
		fn(model);
		return model;
	}

	/** Create a record immediately (write + batch). */
	create(fn: (record: M) => void): Promise<M> {
		return this._db.write(async () => {
			const model = this.prepareCreate(fn);
			await this._db.batch(model);
			return model;
		});
	}
}
