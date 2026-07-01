import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useTeamChannels, type IItem } from './useTeamChannels';

const mockGetTeamListRoom = jest.fn();

jest.mock('../../lib/services/restApi', () => ({
	getTeamListRoom: (...args: any[]) => mockGetTeamListRoom(...args)
}));

jest.mock('../../lib/methods/helpers/log', () => ({
	__esModule: true,
	default: jest.fn(),
	logEvent: jest.fn(),
	events: {
		TC_SEARCH: 'TC_SEARCH',
		TC_CANCEL_SEARCH: 'TC_CANCEL_SEARCH'
	}
}));

const makeRoom = (overrides: Partial<IItem> = {}): IItem =>
	({
		_id: 'room-1',
		fname: 'Room One',
		name: 'room-one',
		teamDefault: false,
		t: 'c',
		...overrides
	} as IItem);

const makePage = (count: number, prefix = 'r') =>
	Array.from({ length: count }, (_, i) => makeRoom({ _id: `${prefix}${i}` as any, fname: `Room ${i}` }));

describe('useTeamChannels', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('loads channels on mount and exposes them via `list`', async () => {
		const rooms = [makeRoom({ _id: 'r1' as any })];
		mockGetTeamListRoom.mockResolvedValue({ success: true, rooms });

		const { result } = renderHook(() => useTeamChannels('team-123'));

		await waitFor(() => expect(result.current.list).toEqual(rooms));
		expect(mockGetTeamListRoom).toHaveBeenCalledWith(
			expect.objectContaining({ teamId: 'team-123', offset: 0, count: 25, type: 'all' })
		);
		expect(result.current.loading).toBe(false);
	});

	it('loadMore appends the next page and advances the offset by the browse-bucket length', async () => {
		const page1 = makePage(25);
		const page2 = [makeRoom({ _id: 'r-extra' as any })];
		mockGetTeamListRoom
			.mockResolvedValueOnce({ success: true, rooms: page1 })
			.mockResolvedValueOnce({ success: true, rooms: page2 });

		const { result } = renderHook(() => useTeamChannels('team-123'));
		await waitFor(() => expect(result.current.list).toHaveLength(25));

		act(() => {
			result.current.loadMore();
		});

		await waitFor(() => expect(result.current.list).toHaveLength(26));
		expect(mockGetTeamListRoom).toHaveBeenNthCalledWith(2, expect.objectContaining({ offset: 25 }));
	});

	it('stops loading once a short page sets `end` (no further fetch)', async () => {
		mockGetTeamListRoom.mockResolvedValue({ success: true, rooms: makePage(1) });

		const { result } = renderHook(() => useTeamChannels('team-123'));
		await waitFor(() => expect(result.current.list).toHaveLength(1));

		act(() => {
			result.current.loadMore();
		});

		await waitFor(() => expect(result.current.loadingMore).toBe(false));
		expect(mockGetTeamListRoom).toHaveBeenCalledTimes(1);
	});

	it('the loadingMore guard prevents a concurrent fetch while one is in flight', async () => {
		let resolveFirst: (value: any) => void = () => {};
		mockGetTeamListRoom
			.mockImplementationOnce(
				() =>
					new Promise(res => {
						resolveFirst = res;
					})
			)
			.mockResolvedValue({ success: true, rooms: makePage(1) });

		const { result } = renderHook(() => useTeamChannels('team-123'));
		await waitFor(() => expect(result.current.loadingMore).toBe(true));

		act(() => {
			result.current.loadMore();
		});
		expect(mockGetTeamListRoom).toHaveBeenCalledTimes(1);

		act(() => {
			resolveFirst({ success: true, rooms: makePage(25) });
		});
		await waitFor(() => expect(result.current.list).toHaveLength(25));
	});

	it('onSearchChangeText resets the search bucket, marks loading, and loads filtered results', async () => {
		mockGetTeamListRoom.mockResolvedValue({ success: true, rooms: makePage(2, 'browse') });

		const { result } = renderHook(() => useTeamChannels('team-123'));
		await waitFor(() => expect(result.current.list).toHaveLength(2));

		act(() => {
			result.current.startSearch();
		});
		expect(result.current.isSearching).toBe(true);

		mockGetTeamListRoom.mockClear();
		mockGetTeamListRoom.mockResolvedValue({ success: true, rooms: [makeRoom({ _id: 'match' as any })] });

		act(() => {
			result.current.onSearchChangeText('design');
		});

		await waitFor(
			() => expect(mockGetTeamListRoom).toHaveBeenCalledWith(expect.objectContaining({ offset: 0, filter: 'design' })),
			{ timeout: 2000 }
		);
		await waitFor(() => expect(result.current.list).toEqual([expect.objectContaining({ _id: 'match' })]));
		expect(result.current.searchText).toBe('design');
	});

	it('cancelSearch restores the preserved browse bucket without a new fetch', async () => {
		const browse = makePage(2, 'browse');
		mockGetTeamListRoom.mockResolvedValue({ success: true, rooms: browse });

		const { result } = renderHook(() => useTeamChannels('team-123'));
		await waitFor(() => expect(result.current.list).toHaveLength(2));

		act(() => {
			result.current.startSearch();
		});

		mockGetTeamListRoom.mockResolvedValue({ success: true, rooms: [makeRoom({ _id: 'match' as any })] });
		act(() => {
			result.current.onSearchChangeText('design');
		});
		await waitFor(() => expect(result.current.list).toEqual([expect.objectContaining({ _id: 'match' })]));

		const callsBeforeCancel = mockGetTeamListRoom.mock.calls.length;

		act(() => {
			result.current.cancelSearch();
		});

		await waitFor(() => expect(result.current.isSearching).toBe(false));
		expect(result.current.list).toEqual(browse);
		expect(mockGetTeamListRoom).toHaveBeenCalledTimes(callsBeforeCancel);
	});

	it('updateItem patches a matching browse item; removeItem drops it', async () => {
		const browse = [makeRoom({ _id: 'r1' as any, teamDefault: false }), makeRoom({ _id: 'r2' as any })];
		mockGetTeamListRoom.mockResolvedValue({ success: true, rooms: browse });

		const { result } = renderHook(() => useTeamChannels('team-123'));
		await waitFor(() => expect(result.current.list).toHaveLength(2));

		act(() => {
			result.current.updateItem('r1' as any, { teamDefault: true });
		});
		await waitFor(() => expect(result.current.list.find(i => i._id === ('r1' as any))?.teamDefault).toBe(true));

		act(() => {
			result.current.removeItem('r1' as any);
		});
		await waitFor(() => expect(result.current.list.map(i => i._id)).toEqual(['r2']));
	});
});
