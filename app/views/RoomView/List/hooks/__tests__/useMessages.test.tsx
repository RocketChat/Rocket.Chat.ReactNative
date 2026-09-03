import { act, renderHook, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { type ReactNode } from 'react';

import { ROOM } from '../../../../../actions/actionsTypes';
import { type IRoomHistoryRequest } from '../../../../../actions/room';
import { type RoomType, type TAnyMessageModel } from '../../../../../definitions';
import database from '../../../../../lib/database';
import { getMessageById } from '../../../../../lib/database/services/Message';
import { getThreadById } from '../../../../../lib/database/services/Thread';
import { MessageTypeLoad } from '../../../../../lib/constants/messageTypeLoad';
import { readThreads } from '../../../../../lib/services/restApi';
import { mockedStore } from '../../../../../reducers/mockedStore';
import { MAX_AUTO_LOADS, QUERY_SIZE } from '../../constants';
import { useMessages } from '../useMessages';

jest.mock('../../../../../lib/database', () => ({
	__esModule: true,
	default: {
		active: {
			get: jest.fn()
		}
	}
}));

jest.mock('../../../../../lib/database/services/Message', () => ({
	getMessageById: jest.fn(() => Promise.resolve(null))
}));

jest.mock('../../../../../lib/database/services/Thread', () => ({
	getThreadById: jest.fn(() => Promise.resolve(null))
}));

jest.mock('../../../../../lib/services/restApi', () => ({
	readThreads: jest.fn(() => Promise.resolve())
}));

jest.mock('../../../../../lib/methods/helpers', () => {
	const actual = jest.requireActual('../../../../../lib/methods/helpers');
	return {
		...actual,
		useDebounce: (fn: (...args: unknown[]) => unknown) => Object.assign(fn, { cancel: jest.fn() })
	};
});

const mockDbGet = database.active.get as unknown as jest.Mock;
const mockGetThreadById = jest.mocked(getThreadById);
const mockGetMessageById = jest.mocked(getMessageById);
const mockReadThreads = jest.mocked(readThreads);

const baseArgs = {
	rid: 'ROOM_ID',
	showMessageInMainThread: true,
	hideSystemMessages: [] as string[],
	serverVersion: '3.0.0' as string | null,
	t: 'c' as RoomType
};

const msg = (overrides: Partial<TAnyMessageModel> & { id: string }): TAnyMessageModel =>
	({
		ts: new Date('2024-01-01'),
		...overrides
	}) as TAnyMessageModel;

describe('useMessages', () => {
	let emittedRows: TAnyMessageModel[];
	let emitVisibleRows: ((rows: TAnyMessageModel[]) => void) | null;
	let queryCalls: unknown[][];
	let unsubscribeSpies: jest.Mock[];
	// Rows served to the targeted one-shot read used by the rejoin raise (the region above the current
	// bound that the bounded observation cannot see). Each call to query(...).fetch() captures its clauses.
	let fetchRows: TAnyMessageModel[];
	let fetchCalls: unknown[][];
	// Count returned by the release path's fetchCount() (number of cached rows above the old bound).
	let fetchCountValue: number;

	const wrapper = ({ children }: { children: ReactNode }) => <Provider store={mockedStore}>{children}</Provider>;

	beforeEach(() => {
		emittedRows = [];
		emitVisibleRows = null;
		queryCalls = [];
		unsubscribeSpies = [];
		fetchRows = [];
		fetchCalls = [];
		fetchCountValue = 0;
		jest.clearAllMocks();
		// Reset historyLoaders so prior test dispatches don't trip the in-flight guard
		mockedStore
			.getState()
			.room.historyLoaders.slice()
			.forEach(loaderId => {
				mockedStore.dispatch({ type: ROOM.HISTORY_FINISHED, loaderId });
			});
		mockDbGet.mockImplementation(() => ({
			query: jest.fn((...args: unknown[]) => {
				queryCalls.push(args);
				return {
					observe: () => ({
						subscribe: (onNext: (rows: TAnyMessageModel[]) => void) => {
							emitVisibleRows = onNext;
							onNext(emittedRows);
							const unsubscribe = jest.fn();
							unsubscribeSpies.push(unsubscribe);
							return { unsubscribe };
						}
					}),
					// Targeted one-shot read for the rejoin raise (region above the current bound).
					fetch: jest.fn(() => {
						fetchCalls.push(args);
						return Promise.resolve(fetchRows);
					}),
					// Count of cached rows above the old bound, read by the release path to size the Live Window.
					fetchCount: jest.fn(() => Promise.resolve(fetchCountValue))
				};
			})
		}));
	});

	const renderUseMessages = (overrides: Partial<Parameters<typeof useMessages>[0]> = {}) =>
		renderHook((props: Partial<Parameters<typeof useMessages>[0]> = {}) => useMessages({ ...baseArgs, ...overrides, ...props }), {
			wrapper
		});

	const buildRows = (loaderId: string) => [msg({ id: `${loaderId}-message` }), msg({ id: loaderId, t: MessageTypeLoad.MORE })];

	const emitRows = (rows: TAnyMessageModel[]) => {
		emittedRows = rows;
		act(() => {
			emitVisibleRows?.(rows);
		});
	};

	const getHistoryDispatches = (dispatchSpy: jest.SpiedFunction<typeof mockedStore.dispatch>): IRoomHistoryRequest[] =>
		dispatchSpy.mock.calls
			.map(([action]) => action)
			.filter(
				(action): action is IRoomHistoryRequest =>
					!!action && typeof action === 'object' && 'type' in action && action.type === ROOM.HISTORY_REQUEST
			);

	const getHistoryDispatchCount = (dispatchSpy: jest.SpiedFunction<typeof mockedStore.dispatch>) =>
		getHistoryDispatches(dispatchSpy).length;

	const emitLoaderSequence = async ({
		dispatchSpy,
		loaderIds,
		getExpectedCount
	}: {
		dispatchSpy: jest.SpiedFunction<typeof mockedStore.dispatch>;
		loaderIds: string[];
		getExpectedCount: (index: number) => number;
	}): Promise<void> => {
		const emitAt = async (index: number): Promise<void> => {
			if (index >= loaderIds.length) {
				return;
			}

			emitRows(buildRows(loaderIds[index]));

			await waitFor(() => {
				expect(getHistoryDispatchCount(dispatchSpy)).toBe(getExpectedCount(index));
			});

			await emitAt(index + 1);
		};

		await emitAt(0);
	};

	it('returns fetchMessages as a function', async () => {
		emittedRows = [msg({ id: 'm1' })];
		const { result } = renderUseMessages();
		await waitFor(() => {
			expect(typeof result.current[2]).toBe('function');
		});
	});

	it('loads main room messages from the messages collection', async () => {
		emittedRows = [msg({ id: 'a' }), msg({ id: 'b' })];
		const { result } = renderUseMessages({ rid: 'R1' });
		await waitFor(() => {
			expect(result.current[0].map(m => m.id)).toEqual(['a', 'b']);
		});
		expect(mockDbGet).toHaveBeenCalledWith('messages');
	});

	it('does not query the database when rid is empty', async () => {
		emittedRows = [msg({ id: 'x' })];
		const { result } = renderUseMessages({ rid: '' });
		await act(async () => {
			await result.current[2]();
		});
		expect(mockDbGet).not.toHaveBeenCalled();
	});

	it('renders the visible rows returned when system message types are hidden', async () => {
		emittedRows = [msg({ id: 'regular' }), msg({ id: 'load-more', t: MessageTypeLoad.MORE })];
		const { result } = renderUseMessages({ hideSystemMessages: ['uj'] });

		await waitFor(() => {
			expect(result.current[0].map(({ id }) => id)).toEqual(['regular', 'load-more']);
		});
	});

	it('returns visibleMessagesIds aligned with visible messages', async () => {
		emittedRows = [msg({ id: 'p' }), msg({ id: 'q' })];
		const { result } = renderUseMessages();
		await waitFor(() => {
			expect(result.current[1].current).toEqual(['p', 'q']);
		});
	});

	it('dispatches room history request when server is 3.16+, user hides system messages, and a load row exists', async () => {
		const dispatchSpy = jest.spyOn(mockedStore, 'dispatch');
		emittedRows = [msg({ id: 'm1', t: undefined }), msg({ id: 'load-more-x', t: MessageTypeLoad.MORE })];
		renderUseMessages({
			serverVersion: '6.0.0',
			hideSystemMessages: ['uj']
		});
		await waitFor(() => {
			expect(dispatchSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					type: ROOM.HISTORY_REQUEST,
					rid: 'ROOM_ID',
					t: 'c',
					loaderId: 'load-more-x'
				})
			);
		});
		dispatchSpy.mockRestore();
	});

	it('does not dispatch roomHistoryRequest again when loaderId has not changed', async () => {
		const dispatchSpy = jest.spyOn(mockedStore, 'dispatch');
		emittedRows = [msg({ id: 'load-more-x', t: MessageTypeLoad.MORE })];

		renderUseMessages({
			serverVersion: '6.0.0',
			hideSystemMessages: ['uj']
		});

		await waitFor(() => {
			expect(getHistoryDispatchCount(dispatchSpy)).toBe(1);
		});

		// Simulate a new message arriving — visibleMessages changes but loaderId stays the same
		emitRows([msg({ id: 'new-msg' }), msg({ id: 'load-more-x', t: MessageTypeLoad.MORE })]);

		await waitFor(() => {
			expect(getHistoryDispatchCount(dispatchSpy)).toBe(1); // still only once
		});

		dispatchSpy.mockRestore();
	});

	it('caps sequential auto-load dispatches after MAX_AUTO_LOADS unique loaders', async () => {
		const dispatchSpy = jest.spyOn(mockedStore, 'dispatch');
		emittedRows = buildRows('loader-1');

		renderUseMessages({
			serverVersion: '6.0.0',
			hideSystemMessages: ['uj']
		});

		await waitFor(() => {
			expect(getHistoryDispatchCount(dispatchSpy)).toBe(1);
		});

		await emitLoaderSequence({
			dispatchSpy,
			loaderIds: Array.from({ length: MAX_AUTO_LOADS }, (_, index) => `loader-${index + 2}`),
			getExpectedCount: index => Math.min(index + 2, MAX_AUTO_LOADS)
		});

		expect(getHistoryDispatchCount(dispatchSpy)).toBe(MAX_AUTO_LOADS);
		dispatchSpy.mockRestore();
	});

	it('resets the auto-load cap when rid changes', async () => {
		const dispatchSpy = jest.spyOn(mockedStore, 'dispatch');
		emittedRows = buildRows('room-a-loader-1');

		const { rerender } = renderUseMessages({
			rid: 'ROOM_A',
			serverVersion: '6.0.0',
			hideSystemMessages: ['uj']
		});

		await waitFor(() => {
			expect(getHistoryDispatchCount(dispatchSpy)).toBe(1);
		});

		await emitLoaderSequence({
			dispatchSpy,
			loaderIds: Array.from({ length: MAX_AUTO_LOADS - 1 }, (_, index) => `room-a-loader-${index + 2}`),
			getExpectedCount: index => index + 2
		});

		emittedRows = buildRows('room-b-loader-1');
		rerender({
			rid: 'ROOM_B',
			serverVersion: '6.0.0',
			hideSystemMessages: ['uj']
		});

		await waitFor(() => {
			expect(getHistoryDispatchCount(dispatchSpy)).toBe(MAX_AUTO_LOADS + 1);
		});

		expect(getHistoryDispatches(dispatchSpy).at(-1)).toEqual(
			expect.objectContaining({
				rid: 'ROOM_B',
				loaderId: 'room-b-loader-1'
			})
		);
		dispatchSpy.mockRestore();
	});

	it('does not re-dispatch the old room loader immediately after navigation before new messages arrive', async () => {
		const dispatchSpy = jest.spyOn(mockedStore, 'dispatch');
		emittedRows = buildRows('room-a-loader');

		const { rerender } = renderUseMessages({
			rid: 'ROOM_A',
			serverVersion: '6.0.0',
			hideSystemMessages: ['uj']
		});

		await waitFor(() => {
			expect(getHistoryDispatchCount(dispatchSpy)).toBe(1);
		});

		// Navigate to ROOM_B — new subscription emits a different loader immediately
		emittedRows = buildRows('room-b-loader');
		rerender({ rid: 'ROOM_B', serverVersion: '6.0.0', hideSystemMessages: ['uj'] });

		await waitFor(() => {
			// Exactly 1 dispatch for ROOM_B (not 2) — the old room-a-loader was
			// snapshotted into lastDispatchedLoaderId on rid change, so it is skipped.
			expect(getHistoryDispatchCount(dispatchSpy)).toBe(2);
			expect(getHistoryDispatches(dispatchSpy).at(-1)).toEqual(
				expect.objectContaining({ rid: 'ROOM_B', loaderId: 'room-b-loader' })
			);
		});

		dispatchSpy.mockRestore();
	});

	it('does not dispatch room history request when server is below 3.16', async () => {
		const dispatchSpy = jest.spyOn(mockedStore, 'dispatch');
		emittedRows = [msg({ id: 'load-more-x', t: MessageTypeLoad.MORE })];
		const { result } = renderUseMessages({
			serverVersion: '3.15.0',
			hideSystemMessages: ['uj']
		});
		await waitFor(() => {
			expect(result.current[0].length).toBeGreaterThan(0);
		});
		expect(getHistoryDispatchCount(dispatchSpy)).toBe(0);
		dispatchSpy.mockRestore();
	});

	it('queries thread_messages and appends thread parent when tmid is set', async () => {
		const parent = {
			...msg({ id: 'parent-thread', t: 'discussion-created' }),
			collection: { table: 'threads' }
		} as TAnyMessageModel;
		mockGetThreadById.mockResolvedValueOnce(parent);
		emittedRows = [msg({ id: 'tm1', tmid: 'THREAD_ID' })];
		const { result } = renderUseMessages({ tmid: 'THREAD_ID' });
		await waitFor(() => {
			expect(mockDbGet).toHaveBeenCalledWith('thread_messages');
		});
		await waitFor(() => {
			const ids = result.current[0].map(m => m.id);
			expect(ids).toContain('parent-thread');
			expect(ids).toContain('tm1');
		});
	});

	it('falls back to getMessageById when thread record is missing', async () => {
		const parent = msg({ id: 'fallback-parent', t: undefined });
		mockGetThreadById.mockResolvedValueOnce(null);
		mockGetMessageById.mockResolvedValueOnce(parent as TAnyMessageModel);
		emittedRows = [msg({ id: 'only-child', tmid: 'TM' })];
		const { result } = renderUseMessages({ tmid: 'TM' });
		await waitFor(() => {
			expect(result.current[0].map(m => m.id)).toContain('fallback-parent');
		});
	});

	it('does not dispatch room history request when hideSystemMessages is empty even if a load row is present', async () => {
		const dispatchSpy = jest.spyOn(mockedStore, 'dispatch');
		emittedRows = [msg({ id: 'load-more-x', t: MessageTypeLoad.MORE })];
		const { result } = renderUseMessages({
			serverVersion: '6.0.0',
			hideSystemMessages: []
		});
		await waitFor(() => {
			expect(result.current[0].length).toBeGreaterThan(0);
		});
		expect(getHistoryDispatchCount(dispatchSpy)).toBe(0);
		dispatchSpy.mockRestore();
	});

	it('does not dispatch room history request when there is no load-type row in visible messages', async () => {
		const dispatchSpy = jest.spyOn(mockedStore, 'dispatch');
		emittedRows = [msg({ id: 'a', t: undefined }), msg({ id: 'b', t: undefined })];
		const { result } = renderUseMessages({
			serverVersion: '6.0.0',
			hideSystemMessages: ['uj']
		});
		await waitFor(() => {
			expect(result.current[0].length).toBeGreaterThan(0);
		});
		expect(getHistoryDispatchCount(dispatchSpy)).toBe(0);
		dispatchSpy.mockRestore();
	});

	it('dispatches room history request for PREVIOUS_CHUNK load type', async () => {
		const dispatchSpy = jest.spyOn(mockedStore, 'dispatch');
		emittedRows = [msg({ id: 'prev-chunk-id', t: MessageTypeLoad.PREVIOUS_CHUNK })];
		renderUseMessages({
			serverVersion: '6.0.0',
			hideSystemMessages: ['uj']
		});
		await waitFor(() => {
			expect(dispatchSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					type: ROOM.HISTORY_REQUEST,
					loaderId: 'prev-chunk-id'
				})
			);
		});
		dispatchSpy.mockRestore();
	});

	it('dispatches room history request for NEXT_CHUNK load type', async () => {
		const dispatchSpy = jest.spyOn(mockedStore, 'dispatch');
		emittedRows = [msg({ id: 'next-chunk-id', t: MessageTypeLoad.NEXT_CHUNK })];
		renderUseMessages({
			serverVersion: '6.0.0',
			hideSystemMessages: ['uj']
		});
		await waitFor(() => {
			expect(dispatchSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					type: ROOM.HISTORY_REQUEST,
					loaderId: 'next-chunk-id'
				})
			);
		});
		dispatchSpy.mockRestore();
	});

	it('does not dispatch roomHistoryRequest when a fetch for the same loaderId is already in flight', async () => {
		// Simulate loadMessagesForRoom having already pushed the UI loader before the DB subscription emits
		mockedStore.dispatch({ type: ROOM.HISTORY_UI_LOADER_PUSH, loaderId: 'load-more-x' });
		const dispatchSpy = jest.spyOn(mockedStore, 'dispatch');
		emittedRows = [msg({ id: 'load-more-x', t: MessageTypeLoad.MORE })];
		const { result } = renderUseMessages({
			serverVersion: '6.0.0',
			hideSystemMessages: ['uj']
		});
		await waitFor(() => {
			expect(result.current[0].length).toBeGreaterThan(0);
		});
		expect(getHistoryDispatchCount(dispatchSpy)).toBe(0);
		dispatchSpy.mockRestore();
	});

	it('does not dispatch room history request when serverVersion is null', async () => {
		const dispatchSpy = jest.spyOn(mockedStore, 'dispatch');
		emittedRows = [msg({ id: 'load-more-x', t: MessageTypeLoad.MORE })];
		const { result } = renderUseMessages({
			serverVersion: null,
			hideSystemMessages: ['uj']
		});
		await waitFor(() => {
			expect(result.current[0].length).toBeGreaterThan(0);
		});
		expect(getHistoryDispatchCount(dispatchSpy)).toBe(0);
		dispatchSpy.mockRestore();
	});

	it('unsubscribes from the observable when the hook unmounts', async () => {
		emittedRows = [msg({ id: 'm1' })];
		const { unmount } = renderUseMessages();
		await waitFor(() => {
			expect(unsubscribeSpies.length).toBeGreaterThan(0);
		});
		const lastUnsubscribe = unsubscribeSpies[unsubscribeSpies.length - 1];
		unmount();
		expect(lastUnsubscribe).toHaveBeenCalled();
	});

	it('grows the query take size when fetchMessages is called multiple times', async () => {
		emittedRows = [msg({ id: 'm1' })];
		const { result } = renderUseMessages();
		await waitFor(() => {
			expect(queryCalls.length).toBeGreaterThan(0);
		});

		const initialTake = queryCalls[queryCalls.length - 1].at(-1);
		expect(initialTake).toEqual(expect.objectContaining({ type: 'take' }));

		await act(async () => {
			await result.current[2]();
		});

		await waitFor(() => {
			expect(queryCalls.length).toBeGreaterThanOrEqual(2);
		});

		// Each call to fetchMessages bumps count.current by QUERY_SIZE — verify the take values differ by QUERY_SIZE.
		const firstTake = JSON.stringify(queryCalls[0].at(-1));
		const secondTake = JSON.stringify(queryCalls[1].at(-1));
		expect(firstTake).not.toEqual(secondTake);
	});

	it('calls readThreads when tmid is set', async () => {
		emittedRows = [msg({ id: 'tm1', tmid: 'THREAD_ID' })];
		renderUseMessages({ tmid: 'THREAD_ID' });
		await waitFor(() => {
			expect(mockReadThreads).toHaveBeenCalledWith('THREAD_ID');
		});
	});

	it('does not call readThreads when tmid is not set', async () => {
		emittedRows = [msg({ id: 'm1' })];
		const { result } = renderUseMessages();
		await waitFor(() => {
			expect(result.current[0].length).toBeGreaterThan(0);
		});
		expect(mockReadThreads).not.toHaveBeenCalled();
	});

	const findBoundClause = (clauses: unknown[]) =>
		clauses.find(
			(clause): clause is { type: 'where'; left: string; comparison: { operator: string; right: { value: number } } } =>
				!!clause &&
				typeof clause === 'object' &&
				(clause as { type?: string }).type === 'where' &&
				(clause as { left?: string }).left === 'ts' &&
				(clause as { comparison?: { operator?: string } }).comparison?.operator === 'lte'
		);

	it('does not apply an upper-bound ts clause when highTs is null (default Live Window)', async () => {
		emittedRows = [msg({ id: 'm1' })];
		renderUseMessages();
		await waitFor(() => {
			expect(queryCalls.length).toBeGreaterThan(0);
		});
		expect(findBoundClause(queryCalls[queryCalls.length - 1])).toBeUndefined();
	});

	it('applies the upper-bound ts clause only after an anchor is set, with take still last', async () => {
		emittedRows = [msg({ id: 'm1' })];
		const { result } = renderUseMessages();
		await waitFor(() => {
			expect(queryCalls.length).toBeGreaterThan(0);
		});

		// Default Live Window: no bound clause.
		expect(findBoundClause(queryCalls[queryCalls.length - 1])).toBeUndefined();

		act(() => {
			result.current[3].setHighTs(1500);
		});

		await waitFor(() => {
			const lastCall = queryCalls[queryCalls.length - 1];
			expect(findBoundClause(lastCall)).toBeDefined();
		});

		const lastCall = queryCalls[queryCalls.length - 1];
		const bound = findBoundClause(lastCall);
		expect(bound?.comparison.right.value).toBe(1500);
		// take must remain the last clause so the existing pagination test stays valid.
		expect(lastCall.at(-1)).toEqual(expect.objectContaining({ type: 'take' }));
	});

	it('seeds the window to a single page (QUERY_SIZE) when an anchor is set rather than growing', async () => {
		emittedRows = [msg({ id: 'm1' })];
		const { result } = renderUseMessages();
		await waitFor(() => {
			expect(queryCalls.length).toBeGreaterThan(0);
		});

		// Grow the Live Window a couple of pages first.
		await act(async () => {
			await result.current[2]();
		});
		await act(async () => {
			await result.current[2]();
		});

		act(() => {
			result.current[3].setHighTs(1500);
		});

		await waitFor(() => {
			expect(findBoundClause(queryCalls[queryCalls.length - 1])).toBeDefined();
		});

		const take = queryCalls[queryCalls.length - 1].find(
			(clause): clause is { type: 'take'; count: number } =>
				!!clause && typeof clause === 'object' && (clause as { type?: string }).type === 'take'
		);
		expect(take?.count).toBe(QUERY_SIZE);
	});

	it('exposes highTs and setHighTs as the 4th tuple element', async () => {
		emittedRows = [msg({ id: 'm1' })];
		const { result } = renderUseMessages();
		await waitFor(() => {
			expect(queryCalls.length).toBeGreaterThan(0);
		});
		expect(result.current[3].highTs).toBeNull();
		expect(typeof result.current[3].setHighTs).toBe('function');

		act(() => {
			result.current[3].setHighTs(1500);
		});

		await waitFor(() => {
			expect(result.current[3].highTs).toBe(1500);
		});
	});

	const findTakeClause = (clauses: unknown[]) =>
		clauses.find(
			(clause): clause is { type: 'take'; count: number } =>
				!!clause && typeof clause === 'object' && (clause as { type?: string }).type === 'take'
		);

	// ms-since-epoch as the model's Date ts. Anchor bounds (highTs) are compared in ms, so a Date
	// whose getTime() equals the chosen ms keeps `ts === highTs` boundary detection exact.
	const at = (ms: number) => new Date(ms);
	// Boundary Newer Loader of the Anchored Window: the row that sits exactly on the bound (ts === highTs).
	const newerLoaderAt = (id: string, ms: number) => msg({ id, t: MessageTypeLoad.NEXT_CHUNK, ts: at(ms) });

	it('raises the bound and GROWS the window when the boundary Newer Loader is consumed and another remains above', async () => {
		emittedRows = [msg({ id: 'm1', ts: at(1000) }), newerLoaderAt('loader-H', 1500)];
		const { result } = renderUseMessages();

		// Anchor the window at the boundary loader's ts.
		act(() => {
			result.current[3].setHighTs(1500);
		});
		await waitFor(() => {
			expect(findBoundClause(queryCalls[queryCalls.length - 1])?.comparison.right.value).toBe(1500);
		});
		const takeBeforeRaise = findTakeClause(queryCalls[queryCalls.length - 1])?.count;
		expect(takeBeforeRaise).toBe(QUERY_SIZE);

		// The targeted read above the bound reveals a NEW Newer Loader at ts 1900.
		fetchRows = [newerLoaderAt('loader-H2', 1900)];

		// loadNextMessages REMOVED the boundary loader: re-emit WITHOUT it (still under the old bound).
		emitRows([msg({ id: 'm1', ts: at(1000) })]);

		// Rejoin RAISE: bound climbs to the surviving loader's ts (1900) AND the window grows by a page.
		await waitFor(() => {
			expect(result.current[3].highTs).toBe(1900);
		});
		const lastCall = queryCalls[queryCalls.length - 1];
		expect(findBoundClause(lastCall)?.comparison.right.value).toBe(1900);
		expect(findTakeClause(lastCall)?.count).toBe(QUERY_SIZE * 2);
	});

	it('releases the anchor to a Live Window when the boundary Newer Loader is consumed and the Gap has closed', async () => {
		emittedRows = [msg({ id: 'm1', ts: at(1000) }), newerLoaderAt('loader-H', 1500)];
		const { result } = renderUseMessages();

		act(() => {
			result.current[3].setHighTs(1500);
		});
		await waitFor(() => {
			expect(findBoundClause(queryCalls[queryCalls.length - 1])?.comparison.right.value).toBe(1500);
		});

		// The targeted read finds NO Newer Loader above the bound: the Gap to the Live Tail closed.
		fetchRows = [];

		// loadNextMessages consumed the boundary loader: re-emit WITHOUT it.
		emitRows([msg({ id: 'm1', ts: at(1000) })]);

		// Rejoin RELEASE: bound becomes null → Live Window. The captured query drops the Q.lte clause.
		await waitFor(() => {
			expect(result.current[3].highTs).toBeNull();
		});
		expect(findBoundClause(queryCalls[queryCalls.length - 1])).toBeUndefined();
	});

	it('grows the released Live Window to preserve the reading position instead of snapping to the Live Tail', async () => {
		// Anchored deep below a large cached newer island. When the Gap closes and the window releases,
		// take(count) must span from the Live Tail down past the original target — otherwise the target is
		// evicted and the list snaps to the tail (NATIVE-1229 #3 reading-position loss).
		emittedRows = [msg({ id: 'm1', ts: at(1000) }), newerLoaderAt('loader-H', 1500)];
		const { result } = renderUseMessages();

		act(() => {
			result.current[3].setHighTs(1500);
		});
		await waitFor(() => {
			expect(findBoundClause(queryCalls[queryCalls.length - 1])?.comparison.right.value).toBe(1500);
		});
		const anchoredTake = findTakeClause(queryCalls[queryCalls.length - 1])?.count ?? 0;

		// Gap closed (no Newer Loader above the bound), but 120 messages sit above it (the cached island).
		fetchRows = [];
		fetchCountValue = 120;

		// loadNextMessages consumed the boundary loader: re-emit without it.
		emitRows([msg({ id: 'm1', ts: at(1000) })]);

		await waitFor(() => {
			expect(result.current[3].highTs).toBeNull();
		});

		// The released Live Window's take spans the anchored window PLUS the 120 messages above it, so the
		// deep target survives the release rather than falling outside take(count).
		const releasedTake = findTakeClause(queryCalls[queryCalls.length - 1])?.count ?? 0;
		expect(releasedTake).toBeGreaterThanOrEqual(anchoredTake + 120);
	});

	it('never releases across an open Gap: keeps highTs finite while a Newer Loader survives above the bound', async () => {
		emittedRows = [msg({ id: 'm1', ts: at(1000) }), newerLoaderAt('loader-H', 1500)];
		const { result } = renderUseMessages();

		act(() => {
			result.current[3].setHighTs(1500);
		});
		await waitFor(() => {
			expect(findBoundClause(queryCalls[queryCalls.length - 1])?.comparison.right.value).toBe(1500);
		});

		// The targeted read still shows a Newer Loader above the bound: the Gap is NOT closed.
		fetchRows = [newerLoaderAt('loader-H2', 1900)];

		// Consume the boundary loader.
		emitRows([msg({ id: 'm1', ts: at(1000) })]);

		// The Gap is still open, so the window must NOT release to a Live Window: highTs stays finite
		// (it climbs to the surviving loader instead of becoming null), and the upper bound persists.
		await waitFor(() => {
			expect(result.current[3].highTs).toBe(1900);
		});
		expect(result.current[3].highTs).not.toBeNull();
		expect(findBoundClause(queryCalls[queryCalls.length - 1])).toBeDefined();
	});
});
