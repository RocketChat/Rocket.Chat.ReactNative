import { act, renderHook, waitFor } from '@testing-library/react-native';

import { type TTeamChannel } from '../../types';
import { useTeamChannels } from '../useTeamChannels';

const mockGetTeamListRoom = jest.fn();

jest.mock('~/lib/services/restApi', () => ({
	getTeamListRoom: (...args: any[]) => mockGetTeamListRoom(...args)
}));

jest.mock('~/lib/methods/helpers/log', () => ({
	__esModule: true,
	default: jest.fn(),
	logEvent: jest.fn(),
	events: {
		TC_SEARCH: 'TC_SEARCH',
		TC_CANCEL_SEARCH: 'TC_CANCEL_SEARCH'
	}
}));

const makeRoom = (overrides: Partial<TTeamChannel> = {}): TTeamChannel =>
	({
		_id: 'room-1',
		fname: 'Room One',
		name: 'room-one',
		teamDefault: false,
		t: 'c',
		...overrides
	}) as TTeamChannel;

const makePage = (count: number, prefix = 'r') =>
	Array.from({ length: count }, (_, i) => makeRoom({ _id: `${prefix}${i}`, fname: `Room ${i}` }));

const deferred = () => {
	let resolve: (value: any) => void = () => {};
	const promise = new Promise(res => {
		resolve = res;
	});
	return { promise, resolve };
};

const renderTeamChannels = () => renderHook(() => useTeamChannels('team-123'));

const searchFor = async (result: { current: ReturnType<typeof useTeamChannels> }, text: string) => {
	act(() => {
		result.current.startSearch();
	});
	act(() => {
		result.current.onSearchChangeText(text);
	});
	await waitFor(() => expect(mockGetTeamListRoom).toHaveBeenCalledWith(expect.objectContaining({ filter: text })));
};

describe('useTeamChannels', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('loads the first page of channels on mount', async () => {
		const rooms = [makeRoom({ _id: 'r1' })];
		mockGetTeamListRoom.mockResolvedValue({ success: true, rooms });

		const { result } = renderTeamChannels();

		await waitFor(() => expect(result.current.list).toEqual(rooms));
		expect(mockGetTeamListRoom).toHaveBeenCalledWith(expect.objectContaining({ teamId: 'team-123', offset: 0, count: 25 }));
		expect(result.current.loading).toBe(false);
	});

	it('appends the next page from the current list length', async () => {
		mockGetTeamListRoom
			.mockResolvedValueOnce({ success: true, rooms: makePage(25) })
			.mockResolvedValueOnce({ success: true, rooms: [makeRoom({ _id: 'r-extra' })] });

		const { result } = renderTeamChannels();
		await waitFor(() => expect(result.current.list).toHaveLength(25));

		act(() => {
			result.current.loadMore();
		});

		await waitFor(() => expect(result.current.list).toHaveLength(26));
		expect(mockGetTeamListRoom).toHaveBeenLastCalledWith(expect.objectContaining({ offset: 25 }));
	});

	it('stops paginating after a short page', async () => {
		mockGetTeamListRoom.mockResolvedValue({ success: true, rooms: makePage(1) });

		const { result } = renderTeamChannels();
		await waitFor(() => expect(result.current.list).toHaveLength(1));

		act(() => {
			result.current.loadMore();
		});

		await waitFor(() => expect(result.current.loadingMore).toBe(false));
		expect(mockGetTeamListRoom).toHaveBeenCalledTimes(1);
	});

	it('shows the filtered results while searching and the browse list again after cancel, without refetching', async () => {
		const browse = makePage(2, 'browse');
		mockGetTeamListRoom.mockResolvedValue({ success: true, rooms: browse });
		const { result } = renderTeamChannels();
		await waitFor(() => expect(result.current.list).toEqual(browse));

		mockGetTeamListRoom.mockResolvedValue({ success: true, rooms: [makeRoom({ _id: 'match' })] });
		await searchFor(result, 'design');
		await waitFor(() => expect(result.current.list.map(room => room._id)).toEqual(['match']));
		const callsBeforeCancel = mockGetTeamListRoom.mock.calls.length;

		act(() => {
			result.current.cancelSearch();
		});

		expect(result.current.isSearching).toBe(false);
		expect(result.current.list).toEqual(browse);
		expect(mockGetTeamListRoom).toHaveBeenCalledTimes(callsBeforeCancel);
	});

	it('ignores a late response for a previous search query', async () => {
		mockGetTeamListRoom.mockResolvedValue({ success: true, rooms: [] });
		const { result } = renderTeamChannels();
		await waitFor(() => expect(result.current.loading).toBe(false));

		const firstQuery = deferred();
		mockGetTeamListRoom.mockReturnValueOnce(firstQuery.promise);
		await searchFor(result, 'a');

		mockGetTeamListRoom.mockResolvedValueOnce({ success: true, rooms: [makeRoom({ _id: 'ab-match' })] });
		act(() => {
			result.current.onSearchChangeText('ab');
		});
		await waitFor(() => expect(result.current.list.map(room => room._id)).toEqual(['ab-match']));

		await act(async () => {
			firstQuery.resolve({ success: true, rooms: [makeRoom({ _id: 'a-match' })] });
			await firstQuery.promise;
		});

		expect(result.current.list.map(room => room._id)).toEqual(['ab-match']);
	});

	it('keeps paginating the browse list when a search is cancelled mid-request', async () => {
		mockGetTeamListRoom.mockResolvedValueOnce({ success: true, rooms: makePage(25) });
		const { result } = renderTeamChannels();
		await waitFor(() => expect(result.current.list).toHaveLength(25));

		const searchRequest = deferred();
		mockGetTeamListRoom.mockReturnValueOnce(searchRequest.promise);
		await searchFor(result, 'design');
		act(() => {
			result.current.cancelSearch();
		});
		await act(async () => {
			searchRequest.resolve({ success: true, rooms: [makeRoom({ _id: 'match' })] });
			await searchRequest.promise;
		});

		mockGetTeamListRoom.mockResolvedValueOnce({ success: true, rooms: [makeRoom({ _id: 'r-extra' })] });
		act(() => {
			result.current.loadMore();
		});

		await waitFor(() => expect(result.current.list).toHaveLength(26));
		expect(mockGetTeamListRoom).toHaveBeenLastCalledWith(expect.objectContaining({ offset: 25, filter: '' }));
	});

	it('keeps an auto-join change made while the next page is loading', async () => {
		mockGetTeamListRoom.mockResolvedValueOnce({ success: true, rooms: makePage(25) });
		const { result } = renderTeamChannels();
		await waitFor(() => expect(result.current.list).toHaveLength(25));

		const nextPage = deferred();
		mockGetTeamListRoom.mockReturnValueOnce(nextPage.promise);
		act(() => {
			result.current.loadMore();
		});
		await waitFor(() => expect(result.current.loadingMore).toBe(true));

		act(() => {
			result.current.updateItem('r0', { teamDefault: true });
		});
		await act(async () => {
			nextPage.resolve({ success: true, rooms: [makeRoom({ _id: 'r-extra' })] });
			await nextPage.promise;
		});

		expect(result.current.list).toHaveLength(26);
		expect(result.current.list[0].teamDefault).toBe(true);
	});

	it('applies auto-join changes and removals to both the search results and the browse list', async () => {
		const browse = [makeRoom({ _id: 'r1' }), makeRoom({ _id: 'r2' })];
		mockGetTeamListRoom.mockResolvedValue({ success: true, rooms: browse });
		const { result } = renderTeamChannels();
		await waitFor(() => expect(result.current.list).toHaveLength(2));

		await searchFor(result, 'r');
		await waitFor(() => expect(result.current.list).toHaveLength(2));

		act(() => {
			result.current.updateItem('r1', { teamDefault: true });
			result.current.removeItem('r2');
		});
		expect(result.current.list).toEqual([expect.objectContaining({ _id: 'r1', teamDefault: true })]);

		act(() => {
			result.current.cancelSearch();
		});
		expect(result.current.list).toEqual([expect.objectContaining({ _id: 'r1', teamDefault: true })]);
	});
});
