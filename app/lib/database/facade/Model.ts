/**
 * Facade Model base class.
 *
 * _raw IS the Drizzle row (snake_case column keys). Field getters read/write _raw directly.
 * Pending ops (create/update/destroy) are tagged on _pendingOp for batch() to execute.
 */

import type { Observable } from 'rxjs';

import type { DbHandle } from '../driver/connection';
import type { Database } from './Database';
import type { TableSchema, RawRecord } from './schema';
import { setRawCoerced, sanitizedRaw } from './schema';
import { observeRow } from './observe';

export type PendingOp = 'create' | 'update' | 'destroy';

// Forward declarations to avoid circular imports at class definition time.
// Collection/Database are imported lazily through the instance's _collection back-ref.
export interface ICollection {
	table: string;
	schema: TableSchema;
	_handle: DbHandle;
	_db: Database;
}

export class Model {
	// WMDB tag — used by withObservables to differentiate types
	static readonly _wmelonTag = 'model';

	/** The Drizzle row. Call sites do `record._raw = sanitizedRaw(...)` directly. */
	_raw: RawRecord;

	/** Back-ref to the Collection this model belongs to. */
	_collection: ICollection;

	/** Pending write op, consumed by batch(). */
	_pendingOp: PendingOp | null = null;

	/** Memoized date cache keyed by ms timestamp — mirrors WMDB @date behavior. */
	_dateCache: Map<number, Date> = new Map();

	/** Query cache for @children. */
	_childrenQueryCache: Record<string, unknown> = {};

	constructor(collection: ICollection, raw: RawRecord) {
		this._collection = collection;
		this._raw = raw;
	}

	get id(): string {
		return this._raw.id as string;
	}

	/** WMDB compat — call sites read `record.collection.table`. */
	get collection(): ICollection {
		return this._collection;
	}

	/** Used by WMDB Relation/children to resolve collections. */
	get collections(): { get: (table: string) => ICollection } {
		const db = this._collection._db;
		return {
			get: (table: string) => db.get(table)._collection
		};
	}

	/** WMDB compat alias — decorators use `this.asModel` to reach _getRaw/_setRaw. */
	get asModel(): this {
		return this;
	}

	// ---------------------------------------------------------------------------
	// _getRaw / _setRaw
	// ---------------------------------------------------------------------------

	_getRaw(column: string): unknown {
		return this._raw[column];
	}

	_setRaw(column: string, value: unknown): void {
		const col = this._collection.schema.columnsByName[column];
		if (col) {
			setRawCoerced(this._raw, column, value, col);
		} else {
			// id and unknown columns assigned as-is (WMDB behavior)
			this._raw[column] = value;
		}
	}

	// ---------------------------------------------------------------------------
	// Pending ops
	// ---------------------------------------------------------------------------

	/**
	 * Prepare a create op: new model, run populator, tag _pendingOp = 'create'.
	 * Returned model is NOT yet persisted — pass to batch().
	 */
	static prepareCreate<M extends Model>(
		this: new (col: ICollection, raw: RawRecord) => M,
		collection: ICollection,
		fn: (record: M) => void
	): M {
		const raw = sanitizedRaw({}, collection.schema);
		const model = new this(collection, raw);
		fn(model);
		model._pendingOp = 'create';
		return model;
	}

	/** Prepare an update: run mutator, tag _pendingOp = 'update'. */
	prepareUpdate(fn: (record: this) => void): this {
		fn(this);
		this._pendingOp = 'update';
		return this;
	}

	/** Tag for permanent deletion in the next batch. */
	prepareDestroyPermanently(): this {
		this._pendingOp = 'destroy';
		return this;
	}

	/** Immediate single-op update via the database writer queue. */
	update(fn: (record: this) => void): Promise<this> {
		return this._collection._db.write(async () => {
			this.prepareUpdate(fn);
			await this._collection._db.batch(this);
			return this;
		});
	}

	/** Immediate single-op permanent delete via the database writer queue. */
	destroyPermanently(): Promise<this> {
		return this._collection._db.write(async () => {
			this.prepareDestroyPermanently();
			await this._collection._db.batch(this);
			return this;
		});
	}

	// ---------------------------------------------------------------------------
	// Observe
	// ---------------------------------------------------------------------------

	/** RxJS Observable<this> that re-emits whenever this row changes. */
	observe(): Observable<this> {
		const { _handle, table, _db: db } = this._collection;
		const { id } = this;
		return observeRow(_handle, table, () => {
			// Re-fetch by id so observe() returns fresh data after updates
			const col = db.get(table);
			// Synchronous fetch: use the underlying Drizzle select
			const rows = col._fetchSync({ id });
			return rows.length > 0 ? (rows[0] as this) : null;
		});
	}
}
