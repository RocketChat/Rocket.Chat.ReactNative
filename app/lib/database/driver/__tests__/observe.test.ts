/**
 * Live-query hook tests — L1 (Jest, mocked expo-sqlite, React 19 renderHook).
 *
 * Covers:
 *  - debounce/coalescing: many rapid events → single re-query (jest fake timers)
 *  - table filtering: events for other tables are ignored
 *  - cross-DB filtering: events from another database file are ignored (the change
 *    listener is global and both DBs share table names)
 *  - structural sharing: same object ref when row content unchanged; new ref when changed
 *  - useRowObserve: re-fetches only on matching rowId; ignores other rowIds
 *  - useRowObserve: returns null when rowId is null
 *  - stable callback discipline: listener registration survives re-renders
 */

import { renderHook, act } from '@testing-library/react-native';
import { useTableQuery, useRowObserve, type UseTableQueryOptions } from '../observe';
import type { DbHandle } from '../connection';

// ---------------------------------------------------------------------------
// expo-sqlite mock
// ---------------------------------------------------------------------------

type ChangeListener = (event: { tableName: string; rowId: number; databaseName: string; databaseFilePath: string }) => void;
const _listeners: ChangeListener[] = [];

const mockSubscription = { remove: jest.fn() };

jest.mock('expo-sqlite', () => ({
	addDatabaseChangeListener: jest.fn((fn: ChangeListener) => {
		_listeners.push(fn);
		return {
			remove: jest.fn(() => {
				const idx = _listeners.indexOf(fn);
				if (idx !== -1) _listeners.splice(idx, 1);
			})
		};
	})
}));

// Database names — events carry an absolute file path; the hooks match on its basename
const DB_NAME = 'open.rocket.chat.db';
const OTHER_DB_NAME = 'default.db';

function fireChange(tableName: string, rowId: number, dbName: string = DB_NAME): void {
	_listeners.forEach(fn => fn({ tableName, rowId, databaseName: 'main', databaseFilePath: `/data/databases/${dbName}` }));
}

// ---------------------------------------------------------------------------
// Fake timer setup
// ---------------------------------------------------------------------------

beforeEach(() => {
	jest.useFakeTimers();
	_listeners.length = 0;
	mockSubscription.remove.mockClear();
});

afterEach(() => {
	jest.useRealTimers();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Row = { id: string; value: string };

const rowKey = (r: Row) => r.id;
const equalFn = (a: Row, b: Row) => a.id === b.id && a.value === b.value;

function makeHandle(queryFn: () => Row[]): { handle: DbHandle; options: UseTableQueryOptions<Row> } {
	const handle = { dbName: DB_NAME } as DbHandle; // test doesn't use db/sqlite
	const options: UseTableQueryOptions<Row> = {
		tables: ['rooms'],
		queryFn,
		rowKey,
		equalFn
	};
	return { handle, options };
}

// ---------------------------------------------------------------------------
// useTableQuery — debounce / coalescing
// ---------------------------------------------------------------------------

describe('useTableQuery debounce', () => {
	it('coalesces many rapid events into a single re-query', () => {
		let callCount = 0;
		const queryFn = jest.fn((): Row[] => {
			callCount++;
			return [{ id: '1', value: `v${callCount}` }];
		});
		const { handle, options } = makeHandle(queryFn);

		renderHook(() => useTableQuery(handle, options));

		const initialCalls = queryFn.mock.calls.length; // initial load

		// Fire 100 events without advancing timers
		for (let i = 0; i < 100; i++) {
			fireChange('rooms', i);
		}

		// Still only the initial call — debounce hasn't fired
		expect(queryFn).toHaveBeenCalledTimes(initialCalls);

		// Advance timers by 16ms to flush the debounce
		act(() => {
			jest.advanceTimersByTime(16);
		});

		// Exactly one additional call — all 100 events coalesced
		expect(queryFn).toHaveBeenCalledTimes(initialCalls + 1);
	});

	it('restarts the debounce timer on each event', () => {
		const queryFn = jest.fn((): Row[] => []);
		const { handle, options } = makeHandle(queryFn);

		renderHook(() => useTableQuery(handle, options));
		const initial = queryFn.mock.calls.length;

		// Fire event, advance 10ms (less than 16ms window), fire again
		fireChange('rooms', 1);
		act(() => {
			jest.advanceTimersByTime(10);
		});
		fireChange('rooms', 2);
		act(() => {
			jest.advanceTimersByTime(10);
		});

		// Timer restarted — no re-query yet
		expect(queryFn).toHaveBeenCalledTimes(initial);

		act(() => {
			jest.advanceTimersByTime(6);
		});

		// Now 16ms since last event — one re-query
		expect(queryFn).toHaveBeenCalledTimes(initial + 1);
	});
});

// ---------------------------------------------------------------------------
// useTableQuery — table filtering
// ---------------------------------------------------------------------------

describe('useTableQuery table filtering', () => {
	it('ignores events for tables not in the subscription list', () => {
		const queryFn = jest.fn((): Row[] => []);
		const { handle, options } = makeHandle(queryFn);

		renderHook(() => useTableQuery(handle, options));
		const initial = queryFn.mock.calls.length;

		fireChange('messages', 1); // 'rooms' not 'messages'
		act(() => {
			jest.advanceTimersByTime(20);
		});

		expect(queryFn).toHaveBeenCalledTimes(initial);
	});

	it('responds to events for a subscribed table', () => {
		const queryFn = jest.fn((): Row[] => []);
		const { handle, options } = makeHandle(queryFn);

		renderHook(() => useTableQuery(handle, options));
		const initial = queryFn.mock.calls.length;

		fireChange('rooms', 1);
		act(() => {
			jest.advanceTimersByTime(20);
		});

		expect(queryFn).toHaveBeenCalledTimes(initial + 1);
	});

	it('ignores events for the same table name in a different database', () => {
		const queryFn = jest.fn((): Row[] => []);
		const { handle, options } = makeHandle(queryFn);

		renderHook(() => useTableQuery(handle, options));
		const initial = queryFn.mock.calls.length;

		fireChange('rooms', 1, OTHER_DB_NAME); // subscribed table, other DB file
		act(() => {
			jest.advanceTimersByTime(20);
		});

		expect(queryFn).toHaveBeenCalledTimes(initial);
	});
});

// ---------------------------------------------------------------------------
// useTableQuery — structural sharing
// ---------------------------------------------------------------------------

describe('useTableQuery structural sharing', () => {
	it('reuses the same object reference when row content is unchanged', () => {
		const row: Row = { id: '1', value: 'hello' };
		const queryFn = jest.fn((): Row[] => [{ ...row }]); // new object each call
		const { handle, options } = makeHandle(queryFn);

		const { result } = renderHook(() => useTableQuery(handle, options));

		const firstRef = result.current[0];
		expect(firstRef).toBeDefined();

		// Trigger re-query with same content
		fireChange('rooms', 1);
		act(() => {
			jest.advanceTimersByTime(20);
		});

		// Content is equal → same reference
		expect(result.current[0]).toBe(firstRef);
	});

	it('produces a new object reference when row content changes', () => {
		let tick = 0;
		const queryFn = jest.fn((): Row[] => [{ id: '1', value: `v${tick}` }]);
		const { handle, options } = makeHandle(queryFn);

		const { result } = renderHook(() => useTableQuery(handle, options));

		const firstRef = result.current[0];

		tick = 1; // change the value on next query
		fireChange('rooms', 1);
		act(() => {
			jest.advanceTimersByTime(20);
		});

		// Content changed → new reference
		expect(result.current[0]).not.toBe(firstRef);
		expect(result.current[0].value).toBe('v1');
	});

	it('returns empty array when dbHandle is null', () => {
		const queryFn = jest.fn((): Row[] => [{ id: '1', value: 'x' }]);
		const options: UseTableQueryOptions<Row> = { tables: ['rooms'], queryFn, rowKey, equalFn };

		const { result } = renderHook(() => useTableQuery(null, options));
		expect(result.current).toEqual([]);
		// queryFn not called — no handle
		expect(queryFn).not.toHaveBeenCalled();
	});
});

// ---------------------------------------------------------------------------
// useRowObserve
// ---------------------------------------------------------------------------

describe('useRowObserve', () => {
	type FetchRow = (rowId: number) => Row | null;

	it('returns null when rowId is null', () => {
		const fetchRow: FetchRow = jest.fn(() => null);
		const handle = { dbName: DB_NAME } as DbHandle;

		const { result } = renderHook(() => useRowObserve(handle, 'subscriptions', null, fetchRow));
		expect(result.current).toBeNull();
		expect(fetchRow).not.toHaveBeenCalled();
	});

	it('returns initial row from fetchRow on mount', () => {
		const fetchRow: FetchRow = jest.fn(rowId => ({ id: String(rowId), value: 'initial' }));
		const handle = { dbName: DB_NAME } as DbHandle;

		const { result } = renderHook(() => useRowObserve(handle, 'subscriptions', 42, fetchRow));
		expect(result.current).toEqual({ id: '42', value: 'initial' });
		expect(fetchRow).toHaveBeenCalledWith(42);
	});

	it('re-fetches when matching rowId event arrives', () => {
		let counter = 0;
		const fetchRow: FetchRow = jest.fn(rowId => ({ id: String(rowId), value: `v${counter}` }));
		const handle = { dbName: DB_NAME } as DbHandle;

		const { result } = renderHook(() => useRowObserve(handle, 'subscriptions', 42, fetchRow));
		expect(result.current?.value).toBe('v0');

		counter = 1;
		act(() => {
			fireChange('subscriptions', 42);
		});
		expect(result.current?.value).toBe('v1');
	});

	it('does not re-fetch for a different rowId', () => {
		const fetchRow: FetchRow = jest.fn(rowId => ({ id: String(rowId), value: 'stable' }));
		const handle = { dbName: DB_NAME } as DbHandle;

		renderHook(() => useRowObserve(handle, 'subscriptions', 42, fetchRow));
		const callsBefore = (fetchRow as jest.Mock).mock.calls.length;

		act(() => {
			fireChange('subscriptions', 99); // different rowId
		});

		expect(fetchRow).toHaveBeenCalledTimes(callsBefore);
	});

	it('does not re-fetch for a different table', () => {
		const fetchRow: FetchRow = jest.fn(rowId => ({ id: String(rowId), value: 'stable' }));
		const handle = { dbName: DB_NAME } as DbHandle;

		renderHook(() => useRowObserve(handle, 'subscriptions', 42, fetchRow));
		const callsBefore = (fetchRow as jest.Mock).mock.calls.length;

		act(() => {
			fireChange('messages', 42); // right rowId, wrong table
		});

		expect(fetchRow).toHaveBeenCalledTimes(callsBefore);
	});

	it('does not re-fetch for the same table and rowId in a different database', () => {
		const fetchRow: FetchRow = jest.fn(rowId => ({ id: String(rowId), value: 'stable' }));
		const handle = { dbName: DB_NAME } as DbHandle;

		renderHook(() => useRowObserve(handle, 'subscriptions', 42, fetchRow));
		const callsBefore = (fetchRow as jest.Mock).mock.calls.length;

		act(() => {
			fireChange('subscriptions', 42, OTHER_DB_NAME); // right table + rowId, other DB file
		});

		expect(fetchRow).toHaveBeenCalledTimes(callsBefore);
	});
});
