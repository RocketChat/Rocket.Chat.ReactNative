/**
 * Facade Database class.
 *
 * Constructed from a DbHandle (from driver/connection.ts).
 * Exposes: get(table) → Collection, write(fn), batch(...models), unsafeResetDatabase().
 */

import { eq } from 'drizzle-orm';
import type { SQLiteTable } from 'drizzle-orm/sqlite-core';

import type { DbHandle } from '../driver/connection';
import type { AppSchema, RawRecord } from './schema';
import { Model, type ICollection, type PendingOp } from './Model';
import { Collection } from './Collection';
import { WriterQueue } from './writer';

/** Constructor for a Model subclass, as registered per table (mirrors WMDB modelClasses). */
export type ModelClass = new (collection: ICollection, raw: RawRecord) => Model;

export class Database {
	private _handle: DbHandle;
	private _schema: AppSchema;
	private _tableMap: Record<string, SQLiteTable>;
	private _modelMap: Record<string, ModelClass>;
	private _collections: Map<string, Collection> = new Map();
	private _writer: WriterQueue = new WriterQueue();

	constructor(handle: DbHandle, schema: AppSchema, tableMap: Record<string, SQLiteTable>, modelMap: Record<string, ModelClass>) {
		this._handle = handle;
		this._schema = schema;
		this._tableMap = tableMap;
		this._modelMap = modelMap;
	}

	/** Get the Collection for the given WMDB table name. */
	get(table: string): Collection {
		const cached = this._collections.get(table);
		if (cached) return cached;

		const tableSchema = this._schema.tables[table];
		if (!tableSchema) throw new Error(`Unknown table '${table}' — not in schema`);

		const drizzleTable = this._tableMap[table];
		if (!drizzleTable) throw new Error(`No Drizzle table registered for '${table}'`);

		// Instantiate the registered subclass so its @field/@date/@json accessors are present.
		const ModelClass = this._modelMap[table] ?? Model;
		const col = new Collection(table, tableSchema, drizzleTable, this._handle, ModelClass);
		col._db = this;
		this._collections.set(table, col);
		return col;
	}

	/** Serialized writer queue. Only one fn runs at a time. */
	write<T>(fn: () => Promise<T>): Promise<T> {
		return this._writer.enqueue(fn);
	}

	/**
	 * Execute all pending ops in ONE Drizzle transaction.
	 * Accepts models or arrays of models (call sites pass both).
	 */
	batch(...args: (Model | Model[] | null | undefined)[]): Promise<void> {
		const models: Model[] = [];
		for (const arg of args) {
			if (Array.isArray(arg)) {
				for (const m of arg) {
					if (m) models.push(m);
				}
			} else if (arg) {
				models.push(arg);
			}
		}

		if (models.length === 0) return Promise.resolve();

		const { db } = this._handle;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(db as any).transaction(() => {
			for (const model of models) {
				const op: PendingOp | null = model._pendingOp;
				if (!op) continue;

				const drizzleTable = this._tableMap[model._collection.table];
				if (!drizzleTable) throw new Error(`No Drizzle table for '${model._collection.table}'`);

				if (op === 'create') {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					(db as any)
						.insert(drizzleTable)
						.values(model._raw as never)
						.run();
				} else if (op === 'update') {
					const { id, ...rest } = model._raw;
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					(db as any)
						.update(drizzleTable)
						.set(rest as never)
						.where(eq((drizzleTable as never as Record<string, never>).id, id))
						.run();
				} else if (op === 'destroy') {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					(db as any)
						.delete(drizzleTable)
						.where(eq((drizzleTable as never as Record<string, never>).id, model._raw.id))
						.run();
				}

				model._pendingOp = null;
			}
		});
		return Promise.resolve();
	}

	/**
	 * Delete all rows from every table on this handle.
	 * Does NOT delete the database file — matches WMDB semantics for clearCache/logout.
	 */
	unsafeResetDatabase(): Promise<void> {
		const { db } = this._handle;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(db as any).transaction(() => {
			for (const drizzleTable of Object.values(this._tableMap)) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(db as any).delete(drizzleTable).run();
			}
		});
		// Clear the collection cache so next fetch sees the empty state
		this._collections.clear();
		return Promise.resolve();
	}
}
