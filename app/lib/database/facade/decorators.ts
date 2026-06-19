/**
 * Decorator implementations matching WMDB semantics verbatim.
 * @field, @date, @json, @readonly, @children, @relation
 *
 * All decorators operate on Model subclasses via _getRaw/_setRaw.
 * Using legacy decorator signature (experimentalDecorators: true).
 */

import type { Observable } from 'rxjs';

import { Model, type ICollection } from './Model';
import type { Query } from './Query';
import * as Q from './Q';
import { observeRow } from './observe';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PropertyDescriptorLike = {
	configurable?: boolean;
	enumerable?: boolean;
	get?: () => unknown;
	set?: (v: unknown) => void;
	value?: unknown;
	writable?: boolean;
};

// Legacy property decorators return a replacement descriptor at runtime (babel applies it),
// but TS only permits a void/any return for property decorators. This alias carries the descriptor
// shape through the implementation while satisfying the decorator-return contract.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LegacyDecoratorReturn = any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyModel = Model & Record<string, any>;

// ---------------------------------------------------------------------------
// parseJSON — matches WMDB json/index.js exactly
// ---------------------------------------------------------------------------

function parseJSON(value: unknown): unknown {
	if (value === null || value === undefined || value === '') return undefined;
	try {
		return JSON.parse(value as string);
	} catch {
		return undefined;
	}
}

// ---------------------------------------------------------------------------
// @field(col)
// ---------------------------------------------------------------------------

export function field(columnName: string) {
	return function (_target: unknown, _key: string, _descriptor?: PropertyDescriptorLike): LegacyDecoratorReturn {
		return {
			configurable: true,
			enumerable: true,
			get(this: AnyModel) {
				return this.asModel._getRaw(columnName);
			},
			set(this: AnyModel, value: unknown) {
				this.asModel._setRaw(columnName, value);
			}
		};
	};
}

// ---------------------------------------------------------------------------
// @date(col)
// ---------------------------------------------------------------------------

export function date(columnName: string) {
	return function (_target: unknown, _key: string, _descriptor?: PropertyDescriptorLike): LegacyDecoratorReturn {
		return {
			configurable: true,
			enumerable: true,
			get(this: AnyModel): Date | null {
				const rawValue = this.asModel._getRaw(columnName);
				if (typeof rawValue === 'number') {
					const cached = this.asModel._dateCache.get(rawValue);
					if (cached) return cached;
					const d = new Date(rawValue);
					this.asModel._dateCache.set(rawValue, d);
					return d;
				}
				return null;
			},
			set(this: AnyModel, value: unknown) {
				const date = value as Date | null | number | undefined;
				const rawValue = date ? +new Date(date as Date) : null;
				if (rawValue && date) {
					this.asModel._dateCache.set(rawValue, new Date(date as Date));
				}
				this.asModel._setRaw(columnName, rawValue);
			}
		};
	};
}

// ---------------------------------------------------------------------------
// @json(col, sanitizer)
// ---------------------------------------------------------------------------

export function json(
	rawFieldName: string,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	sanitizer: (value: unknown, model: Model) => any
) {
	return function (_target: unknown, _key: string, _descriptor?: PropertyDescriptorLike): LegacyDecoratorReturn {
		return {
			configurable: true,
			enumerable: true,
			get(this: AnyModel): unknown {
				const model = this.asModel;
				const rawValue = model._getRaw(rawFieldName);
				const parsedValue = parseJSON(rawValue);
				const sanitized = sanitizer(parsedValue, model);
				return sanitized;
			},
			set(this: AnyModel, value: unknown): void {
				const model = this.asModel;
				const sanitizedValue = sanitizer(value, model);
				const stringifiedValue = sanitizedValue != null ? JSON.stringify(sanitizedValue) : null;
				model._setRaw(rawFieldName, stringifiedValue);
			}
		};
	};
}

// ---------------------------------------------------------------------------
// @readonly — wraps underlying descriptor's setter to throw
// ---------------------------------------------------------------------------

export function readonly(_target: unknown, key: string, descriptor: PropertyDescriptorLike): LegacyDecoratorReturn {
	if (descriptor.get || descriptor.set) {
		return {
			...descriptor,
			set() {
				throw new Error(`Attempt to set value on @readonly property '${key}'`);
			}
		};
	}
	return { ...descriptor, writable: false };
}

// ---------------------------------------------------------------------------
// @children(childTable)
// ---------------------------------------------------------------------------

export function children(childTable: string) {
	return function (_target: unknown, _key: string, _descriptor?: PropertyDescriptorLike): LegacyDecoratorReturn {
		return {
			configurable: true,
			enumerable: true,
			get(this: AnyModel): Query<Model> {
				const model = this.asModel;
				const cache = model._childrenQueryCache;
				if (cache[childTable]) return cache[childTable] as Query<Model>;

				const childCollection = model.collections.get(childTable) as ICollection;
				const association = (model.constructor as { associations?: Record<string, { type: string; foreignKey: string }> })
					.associations?.[childTable];
				if (!association || association.type !== 'has_many') {
					throw new Error(`@children decorator used for a table that's not has_many: ${childTable}`);
				}

				const query = (childCollection as unknown as { query: (...c: unknown[]) => Query<Model> }).query(
					Q.where(association.foreignKey, model.id)
				);
				cache[childTable] = query;
				return query;
			},
			set() {
				// no-op like WMDB's logError
			}
		};
	};
}

// ---------------------------------------------------------------------------
// Relation
// ---------------------------------------------------------------------------

export class Relation<T extends Model = Model> {
	static readonly _wmelonTag = 'relation';

	private _model: AnyModel;
	private _relationTableName: string;
	private _columnName: string;

	constructor(model: AnyModel, relationTableName: string, columnName: string) {
		this._model = model;
		this._relationTableName = relationTableName;
		this._columnName = columnName;
	}

	get id(): string | null {
		return this._model._getRaw(this._columnName) as string | null;
	}

	set id(newId: string | null | undefined) {
		this._model._setRaw(this._columnName, newId ?? null);
	}

	fetch(): Promise<T | null> {
		const { id } = this;
		if (id) {
			const col = this._model.collections.get(this._relationTableName);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			return (col as any)._db.get(this._relationTableName).find(id);
		}
		return Promise.resolve(null);
	}

	then<U>(onFulfill: (v: T | null) => U, onReject?: (r: unknown) => U): Promise<U> {
		return this.fetch().then(onFulfill, onReject);
	}

	set(record: T | null | undefined): void {
		this.id = record?.id ?? null;
	}

	observe(): Observable<T | null> {
		const { _handle } = this._model._collection;
		const model = this._model;
		const relationTableName = this._relationTableName;
		const columnName = this._columnName;
		return observeRow(_handle, relationTableName, () => {
			const id = model._getRaw(columnName) as string | null;
			if (!id) return null;
			const col = model.collections.get(relationTableName);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const rows = (col as any)._fetchSync({ id });
			return rows.length > 0 ? rows[0] : null;
		}) as Observable<T | null>;
	}
}

// ---------------------------------------------------------------------------
// @relation(table, idColumn)
// ---------------------------------------------------------------------------

export function relation(table: string, idColumn: string) {
	return function (_target: unknown, _key: string, _descriptor?: PropertyDescriptorLike): LegacyDecoratorReturn {
		const cacheKey = `_rel_${table}_${idColumn}`;
		return {
			configurable: true,
			enumerable: true,
			get(this: AnyModel): Relation {
				if (!this[cacheKey]) {
					this[cacheKey] = new Relation(this.asModel, table, idColumn);
				}
				return this[cacheKey] as Relation;
			},
			set() {
				// Relation is read-only on the model (set via .set(record) on the Relation instance)
			}
		};
	};
}
