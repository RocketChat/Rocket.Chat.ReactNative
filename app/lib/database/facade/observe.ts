/**
 * RxJS Observable bridge over expo-sqlite's addDatabaseChangeListener.
 *
 * NOT the React hooks in driver/observe.ts — this produces real RxJS Observables
 * for the 26 observe()/observeWithColumns() sites that store subscriptions in useRef.
 *
 * Per-table discipline:
 *   - single addDatabaseChangeListener per subscription
 *   - filter by databaseFilePath + tableName
 *   - ~16ms debounce to coalesce per-row events from large transactions
 *   - structural-share: reuse unchanged row references so React.memo bails out
 */

import { Observable } from 'rxjs';
import { addDatabaseChangeListener } from 'expo-sqlite';

import type { DbHandle } from '../driver/connection';

// ---------------------------------------------------------------------------
// Structural sharing helpers
// ---------------------------------------------------------------------------

/** Row-like emitted by the observables: a Model (has `id` + `_raw`) or a plain row. */
interface HasId {
	id: string;
	_raw?: Record<string, unknown>;
}

type RawRow = Record<string, unknown>;

/** The underlying row data used for equality — Model._raw when present, else the value itself. */
function rowData(x: HasId): RawRow {
	return x._raw ?? (x as unknown as RawRow);
}

/** Replace each entry in next with the previous reference when content is identical. */
function structuralShare<T extends HasId>(prev: Map<string, T>, next: T[]): T[] {
	const result: T[] = new Array(next.length);
	for (let i = 0; i < next.length; i++) {
		const row = next[i];
		const old = prev.get(row.id);
		result[i] = old !== undefined && shallowEqual(rowData(old), rowData(row)) ? old : row;
	}
	return result;
}

function shallowEqual(a: RawRow, b: RawRow): boolean {
	const keysA = Object.keys(a);
	if (keysA.length !== Object.keys(b).length) return false;
	for (const k of keysA) {
		if (a[k] !== b[k]) return false;
	}
	return true;
}

// ---------------------------------------------------------------------------
// Table Observable
// ---------------------------------------------------------------------------

/**
 * Produces an Observable that emits a new array whenever the given table changes.
 * Re-runs fetchFn and structurally shares unchanged row references.
 */
export function observeTable<T extends HasId>(
	handle: DbHandle,
	tableName: string,
	fetchFn: () => T[],
	debounceMs = 16
): Observable<T[]> {
	return new Observable<T[]>(subscriber => {
		const prevMap = new Map<string, T>();

		const emit = () => {
			if (subscriber.closed) return;
			const fresh = fetchFn();
			const shared = structuralShare(prevMap, fresh);
			prevMap.clear();
			for (const row of shared) {
				prevMap.set(row.id, row);
			}
			subscriber.next(shared);
		};

		// Initial emit
		emit();

		let timer: ReturnType<typeof setTimeout> | null = null;
		const sub = addDatabaseChangeListener(event => {
			if (!event.databaseFilePath.endsWith(`/${handle.dbName}`)) return;
			if (event.tableName !== tableName) return;
			if (timer !== null) clearTimeout(timer);
			timer = setTimeout(emit, debounceMs);
		});

		return () => {
			sub.remove();
			if (timer !== null) clearTimeout(timer);
		};
	});
}

/**
 * Produces an Observable that emits whenever a specific row (by id) changes.
 * Uses rowId matching from the change event for precision.
 */
export function observeRow<T>(handle: DbHandle, tableName: string, fetchFn: () => T | null, debounceMs = 16): Observable<T> {
	return new Observable<T>(subscriber => {
		const emit = () => {
			if (subscriber.closed) return;
			const row = fetchFn();
			if (row !== null) subscriber.next(row);
		};

		// Initial emit
		emit();

		let timer: ReturnType<typeof setTimeout> | null = null;
		const sub = addDatabaseChangeListener(event => {
			if (!event.databaseFilePath.endsWith(`/${handle.dbName}`)) return;
			if (event.tableName !== tableName) return;
			if (timer !== null) clearTimeout(timer);
			timer = setTimeout(emit, debounceMs);
		});

		return () => {
			sub.remove();
			if (timer !== null) clearTimeout(timer);
		};
	});
}

/**
 * Like observeTable, but only re-emits when one of the watched columns changes.
 * Used by observeWithColumns.
 */
export function observeTableWithColumns<T extends HasId>(
	handle: DbHandle,
	tableName: string,
	columns: string[],
	fetchFn: () => T[],
	debounceMs = 16
): Observable<T[]> {
	const colSet = new Set(columns);
	return new Observable<T[]>(subscriber => {
		const prevMap = new Map<string, T>();
		let lastRows: T[] = [];

		const emit = (force = false) => {
			if (subscriber.closed) return;
			const fresh = fetchFn();
			const shared = structuralShare(prevMap, fresh);

			// Diff on watched columns only
			if (!force && sameByColumns(lastRows, shared, colSet)) return;

			prevMap.clear();
			for (const row of shared) {
				prevMap.set(row.id, row);
			}
			lastRows = shared;
			subscriber.next(shared);
		};

		// Initial emit (force = true so it always fires once)
		emit(true);

		let timer: ReturnType<typeof setTimeout> | null = null;
		const sub = addDatabaseChangeListener(event => {
			if (!event.databaseFilePath.endsWith(`/${handle.dbName}`)) return;
			if (event.tableName !== tableName) return;
			if (timer !== null) clearTimeout(timer);
			timer = setTimeout(() => emit(false), debounceMs);
		});

		return () => {
			sub.remove();
			if (timer !== null) clearTimeout(timer);
		};
	});
}

function sameByColumns<T extends HasId>(prev: T[], next: T[], cols: Set<string>): boolean {
	if (prev.length !== next.length) return false;
	const prevById = new Map(prev.map(r => [r.id, rowData(r)]));
	for (const row of next) {
		const a = prevById.get(row.id);
		if (!a) return false;
		const b = rowData(row);
		for (const col of cols) {
			if (a[col] !== b[col]) return false;
		}
	}
	return true;
}
