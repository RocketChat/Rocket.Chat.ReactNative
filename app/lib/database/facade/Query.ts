/**
 * Query builder — returned by Collection.query(...clauses).
 * Terminal methods: fetch / fetchCount / observe / observeWithColumns.
 */

import type { Observable } from 'rxjs';

import type { Model } from './Model';
import type * as Q from './Q';

export interface ICollection<M extends Model> {
	_fetchAll(clauses: Q.Clause[]): M[];
	_fetchCount(clauses: Q.Clause[]): number;
	_observe(clauses: Q.Clause[]): Observable<M[]>;
	_observeWithColumns(clauses: Q.Clause[], cols: string[]): Observable<M[]>;
}

export class Query<M extends Model> {
	private _collection: ICollection<M>;
	private _clauses: Q.Clause[];

	constructor(collection: ICollection<M>, clauses: Q.Clause[]) {
		this._collection = collection;
		this._clauses = clauses;
	}

	/** Returns all matching records. */
	fetch(): Promise<M[]> {
		return Promise.resolve(this._collection._fetchAll(this._clauses));
	}

	/** Returns count of matching records. */
	fetchCount(): Promise<number> {
		return Promise.resolve(this._collection._fetchCount(this._clauses));
	}

	/** Observable that emits on every change to the underlying table. */
	observe(): Observable<M[]> {
		return this._collection._observe(this._clauses);
	}

	/**
	 * Observable that emits only when one of the watched columns changes.
	 * Used by observeWithColumns(cols) call sites (7 sites).
	 */
	observeWithColumns(cols: string[]): Observable<M[]> {
		return this._collection._observeWithColumns(this._clauses, cols);
	}

	/** Extend this query with additional clauses. */
	extend(...clauses: Q.Clause[]): Query<M> {
		return new Query(this._collection, [...this._clauses, ...clauses]);
	}
}
