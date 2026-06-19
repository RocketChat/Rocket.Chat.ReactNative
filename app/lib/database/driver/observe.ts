/**
 * Live-query primitives — PoC-validated patterns ported from poc-drizzle-livequery.
 *
 * Two patterns:
 *
 *   useTableQuery (V2) — table-filtered change listener + ~16ms debounce + re-query +
 *     structural sharing. expo-sqlite fires one event per row even inside a single
 *     transaction: a 5000-row tx fires 5000 events. The debounce coalesces these into
 *     one re-query. Structural sharing keeps the same object reference when a row's
 *     content is unchanged, so React.memo bails out for unchanged rows.
 *
 *   useRowObserve (V3) — per-rowid subscription. Only re-fetches when the event's
 *     rowId matches the watched rowid. Suitable for hot single-row sites (e.g. a
 *     RoomItem that re-renders on every unread-count change).
 *
 * Two subtle bugs from the PoC that would silently degrade back to re-render-everything
 * if not handled inside these primitives:
 *   (a) Fresh callback prop per render: the listener must capture a stable ref, not the
 *       component's latest render closure, or every render re-registers the listener.
 *   (b) Rebuilt result objects per event: structural sharing must compare by content,
 *       not by reference, and reuse previous references when content is unchanged.
 *
 * The `equalFn` parameter encodes which fields constitute "same content" for a given
 * row type. Callers provide it once; the hook holds it stable via useRef.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { addDatabaseChangeListener, type DatabaseChangeEvent } from 'expo-sqlite';

import type { DbHandle } from './connection';

// addDatabaseChangeListener is GLOBAL across every open database, and both our DBs
// share table names (e.g. `users` exists in default.db and each per-server DB).
// Filtering by tableName alone would let a write in one DB trigger re-queries —
// or, worse, rowid-collision refetches — in components observing the other.
// `databaseName` in the event is always 'main', so the file path is the only
// reliable discriminator.
function eventMatchesDb(event: DatabaseChangeEvent, dbName: string): boolean {
	return event.databaseFilePath.endsWith(`/${dbName}`);
}

// ---------------------------------------------------------------------------
// useTableQuery — V2 structural-sharing list hook
// ---------------------------------------------------------------------------

export type QueryFn<T> = () => T[];
export type EqualFn<T> = (a: T, b: T) => boolean;
export type RowKey<T> = (row: T) => string | number;

export interface UseTableQueryOptions<T> {
	/** Which tables to listen on — filter ignores events for other tables */
	tables: string[];
	/** Function that runs the Drizzle query synchronously and returns the full result set */
	queryFn: QueryFn<T>;
	/**
	 * Returns the stable row identity key (e.g. row.id or row.rowid).
	 * Used to locate the previous row object for structural sharing.
	 */
	rowKey: RowKey<T>;
	/**
	 * Returns true when two row objects have the same content.
	 * When true, the previous object reference is reused so React.memo bails out.
	 */
	equalFn: EqualFn<T>;
	/** Debounce window in ms. Defaults to 16ms (one animation frame). */
	debounceMs?: number;
}

/**
 * Subscribes to the listed tables and returns a structurally-shared, stably-referenced
 * array of rows. Re-renders only when the query result actually changes.
 *
 * @param dbHandle  The database handle from `openServerDb` / `openServersDb`.
 * @param options   Query and structural-sharing configuration.
 * @param deps      Extra deps beyond `dbHandle` that should trigger a full re-fetch
 *                  (e.g. filter values). Changing `tables` or `queryFn` identity does
 *                  not automatically re-subscribe — pass them as deps if they can change.
 */
export function useTableQuery<T>(
	dbHandle: DbHandle | null | undefined,
	options: UseTableQueryOptions<T>,
	deps: unknown[] = []
): T[] {
	const { tables, queryFn, rowKey, equalFn, debounceMs = 16 } = options;

	const [rows, setRows] = useState<T[]>([]);
	const prevMap = useRef(new Map<string | number, T>());
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Stable refs — prevent the listener from capturing a stale closure
	const queryFnRef = useRef(queryFn);
	useEffect(() => {
		queryFnRef.current = queryFn;
	});
	const rowKeyRef = useRef(rowKey);
	useEffect(() => {
		rowKeyRef.current = rowKey;
	});
	const equalFnRef = useRef(equalFn);
	useEffect(() => {
		equalFnRef.current = equalFn;
	});

	const fetchAndReconcile = useCallback(() => {
		const fresh = queryFnRef.current();
		const prev = prevMap.current;
		const next = new Map<string | number, T>();

		const result = fresh.map(row => {
			const key = rowKeyRef.current(row);
			const old = prev.get(key);
			// Reuse previous reference when content is identical — memo bailout
			const reused = old !== undefined && equalFnRef.current(old, row) ? old : row;
			next.set(key, reused);
			return reused;
		});

		prevMap.current = next;
		setRows(result);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Stable string derived from the tables list so the effect has a primitive dep
	// rather than a spread that would differ on every render.
	const tableKey = tables.slice().sort().join('\0');

	useEffect(() => {
		if (!dbHandle) {
			setRows([]);
			return;
		}

		// Initial load
		fetchAndReconcile();

		const tableSet = new Set(tables);
		const sub = addDatabaseChangeListener((event: DatabaseChangeEvent) => {
			if (!eventMatchesDb(event, dbHandle.dbName)) return;
			if (!tableSet.has(event.tableName)) return;
			// Debounce: coalesce all events from a single large transaction into one re-query
			if (timerRef.current !== null) clearTimeout(timerRef.current);
			timerRef.current = setTimeout(fetchAndReconcile, debounceMs);
		});

		return () => {
			sub.remove();
			if (timerRef.current !== null) {
				clearTimeout(timerRef.current);
				timerRef.current = null;
			}
		};
		// tableKey is a stable string derived from tables; debounceMs treated as stable
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [dbHandle, fetchAndReconcile, tableKey, ...deps]);

	return rows;
}

// ---------------------------------------------------------------------------
// useRowObserve — V3 per-rowid hook
// ---------------------------------------------------------------------------

export type FetchRowFn<T> = (rowId: number) => T | null;

/**
 * Subscribes to changes for a single row identified by its SQLite rowid.
 * Re-fetches only when an event for `tableName` + `rowId` arrives.
 *
 * `onConflictDoUpdate` keeps the same rowid, so per-rowid observers survive upserts.
 * A rowid of null/undefined (row not yet inserted) causes the hook to return null.
 */
export function useRowObserve<T>(
	dbHandle: DbHandle | null | undefined,
	tableName: string,
	rowId: number | null | undefined,
	fetchRow: FetchRowFn<T>
): T | null {
	const [row, setRow] = useState<T | null>(() => {
		if (!dbHandle || rowId == null) return null;
		return fetchRow(rowId);
	});

	// Stable ref so the listener never captures a stale fetchRow
	const fetchRowRef = useRef(fetchRow);
	useEffect(() => {
		fetchRowRef.current = fetchRow;
	});

	useEffect(() => {
		if (!dbHandle || rowId == null) {
			setRow(null);
			return;
		}

		// Load immediately on mount or when rowId changes
		setRow(fetchRowRef.current(rowId));

		const sub = addDatabaseChangeListener((event: DatabaseChangeEvent) => {
			if (!eventMatchesDb(event, dbHandle.dbName)) return;
			if (event.tableName !== tableName) return;
			if (event.rowId !== rowId) return;
			setRow(fetchRowRef.current(rowId));
		});

		return () => sub.remove();
	}, [dbHandle, tableName, rowId]);

	return row;
}
