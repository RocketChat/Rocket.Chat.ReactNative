import { act, renderHook, waitFor } from '@testing-library/react-native';

import { getDirectory } from '~/lib/services/restApi';
import { useDirectorySearch } from '../useDirectorySearch';

jest.mock('~/lib/services/restApi', () => ({ getDirectory: jest.fn() }));

const mockGetDirectory = getDirectory as jest.MockedFunction<typeof getDirectory>;

const rooms = (...ids: string[]) => ids.map(_id => ({ _id, name: _id }));

const pageResponse = (result: ReturnType<typeof rooms>, total: number) =>
	({ success: true, result, total, count: result.length, offset: 0 }) as never;

const respondWith = (result: ReturnType<typeof rooms>, total: number) =>
	mockGetDirectory.mockResolvedValueOnce(pageResponse(result, total));

const respondLater = () => {
	let respond: (result: ReturnType<typeof rooms>, total: number) => void = () => {};
	mockGetDirectory.mockReturnValueOnce(
		new Promise(resolve => {
			respond = (result, total) => resolve(pageResponse(result, total));
		})
	);
	return (result: ReturnType<typeof rooms>, total: number) => respond(result, total);
};

const runDebounced = async (trigger: () => void) => {
	await act(async () => {
		trigger();
		await jest.runOnlyPendingTimersAsync();
	});
};

const roomIds = (rows: { _id: string }[]) => rows.map(room => room._id);

describe('useDirectorySearch', () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
		jest.clearAllMocks();
	});

	it('keeps one row per room when pages overlap', async () => {
		respondWith(rooms('a', 'b', 'c'), 5);
		const { result } = renderHook(() => useDirectorySearch('channels'));
		await waitFor(() => expect(result.current.data).toHaveLength(3));

		respondWith(rooms('c', 'd', 'e'), 5);
		await runDebounced(result.current.loadMore);

		expect(roomIds(result.current.data)).toEqual(['a', 'b', 'c', 'd', 'e']);
	});

	it('keeps one row per room when a page repeats a room', async () => {
		respondWith(rooms('a', 'a', 'b'), 5);
		const { result } = renderHook(() => useDirectorySearch('channels'));
		await waitFor(() => expect(result.current.data).toHaveLength(2));
		expect(roomIds(result.current.data)).toEqual(['a', 'b']);

		respondWith(rooms('c', 'd'), 5);
		await runDebounced(result.current.loadMore);

		expect(mockGetDirectory).toHaveBeenLastCalledWith(expect.objectContaining({ offset: 3 }));
		expect(roomIds(result.current.data)).toEqual(['a', 'b', 'c', 'd']);
	});

	it('requests the next page after every row the server returned', async () => {
		respondWith(rooms('a', 'b', 'c'), 7);
		const { result } = renderHook(() => useDirectorySearch('channels'));
		await waitFor(() => expect(result.current.data).toHaveLength(3));

		respondWith(rooms('c', 'd', 'e'), 7);
		await runDebounced(result.current.loadMore);
		expect(result.current.data).toHaveLength(5);

		respondWith(rooms('f'), 7);
		await runDebounced(result.current.loadMore);

		expect(mockGetDirectory).toHaveBeenLastCalledWith(expect.objectContaining({ offset: 6 }));
		expect(result.current.data).toHaveLength(6);
	});

	it('stops loading more once every server row was fetched', async () => {
		respondWith(rooms('a', 'b'), 3);
		const { result } = renderHook(() => useDirectorySearch('channels'));
		await waitFor(() => expect(result.current.data).toHaveLength(2));

		respondWith(rooms('b'), 3);
		await runDebounced(result.current.loadMore);
		expect(mockGetDirectory).toHaveBeenCalledTimes(2);

		await runDebounced(result.current.loadMore);

		expect(mockGetDirectory).toHaveBeenCalledTimes(2);
	});

	it('runs a new search even when the list asks for more rows right after it', async () => {
		respondWith(rooms('a', 'b'), 10);
		const { result } = renderHook(() => useDirectorySearch('channels'));
		await waitFor(() => expect(result.current.data).toHaveLength(2));

		respondWith(rooms('x'), 1);
		act(() => result.current.onSearchChangeText('x'));
		await runDebounced(result.current.loadMore);

		expect(mockGetDirectory).toHaveBeenLastCalledWith(expect.objectContaining({ text: 'x', offset: 0 }));
		expect(roomIds(result.current.data)).toEqual(['x']);
	});

	it('drops a page that arrives after a newer search started', async () => {
		respondWith(rooms('a', 'b'), 10);
		const { result } = renderHook(() => useDirectorySearch('channels'));
		await waitFor(() => expect(result.current.data).toHaveLength(2));

		const respondToLoadMore = respondLater();
		await runDebounced(result.current.loadMore);

		respondWith(rooms('x'), 1);
		await runDebounced(() => result.current.onSearchChangeText('x'));
		expect(roomIds(result.current.data)).toEqual(['x']);

		await act(async () => {
			respondToLoadMore(rooms('c', 'd'), 10);
			await jest.runOnlyPendingTimersAsync();
		});

		expect(roomIds(result.current.data)).toEqual(['x']);
	});

	it('drops a page that arrives while a newer search waits for its debounce', async () => {
		respondWith(rooms('a', 'b'), 10);
		const { result } = renderHook(() => useDirectorySearch('channels'));
		await waitFor(() => expect(result.current.data).toHaveLength(2));

		const respondToLoadMore = respondLater();
		await runDebounced(result.current.loadMore);

		act(() => result.current.onSearchChangeText('x'));
		await act(async () => {
			respondToLoadMore(rooms('c', 'd'), 10);
		});
		expect(result.current.data).toEqual([]);

		respondWith(rooms('x'), 1);
		await act(async () => {
			await jest.runOnlyPendingTimersAsync();
		});

		expect(mockGetDirectory).toHaveBeenLastCalledWith(expect.objectContaining({ text: 'x', offset: 0 }));
		expect(roomIds(result.current.data)).toEqual(['x']);
		expect(result.current.loading).toBe(false);
	});

	it('hides the previous type rows while the new type waits for its debounce', async () => {
		respondWith(rooms('a', 'b'), 2);
		const { result } = renderHook(() => useDirectorySearch('channels'));
		await waitFor(() => expect(result.current.data).toHaveLength(2));

		act(() => result.current.changeType('users'));

		expect(result.current.type).toBe('users');
		expect(result.current.data).toEqual([]);
		expect(result.current.loading).toBe(true);

		respondWith(rooms('u'), 1);
		await act(async () => {
			await jest.runOnlyPendingTimersAsync();
		});

		expect(mockGetDirectory).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'users', offset: 0 }));
		expect(roomIds(result.current.data)).toEqual(['u']);
		expect(result.current.loading).toBe(false);
	});

	it('hides the previous search rows while the new text waits for its debounce', async () => {
		respondWith(rooms('a', 'b'), 2);
		const { result } = renderHook(() => useDirectorySearch('channels'));
		await waitFor(() => expect(result.current.data).toHaveLength(2));

		act(() => result.current.onSearchChangeText(''));

		expect(result.current.data).toEqual([]);
	});
});
