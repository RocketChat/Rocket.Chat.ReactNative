import { act, renderHook } from '@testing-library/react-native';

import { useSearch } from '../useSearch';

jest.mock('~/lib/methods/search', () => ({
	searchLocal: jest.fn(() => Promise.resolve([])),
	searchRemote: jest.fn(() => Promise.resolve([]))
}));

describe('RoomsListView useSearch', () => {
	it('cancels the system search bar and leaves search mode when search stops', () => {
		const { result } = renderHook(() => useSearch());
		const cancelSearch = jest.fn();
		Object.assign(result.current.searchBarRef, { current: { cancelSearch } });

		act(() => result.current.startSearch());
		expect(result.current.searchEnabled).toBe(true);

		act(() => result.current.stopSearch());

		expect(cancelSearch).toHaveBeenCalledTimes(1);
		expect(result.current.searchEnabled).toBe(false);
	});

	it('leaves search mode without touching the system search bar on reset', () => {
		const { result } = renderHook(() => useSearch());
		const cancelSearch = jest.fn();
		Object.assign(result.current.searchBarRef, { current: { cancelSearch } });

		act(() => result.current.startSearch());
		act(() => result.current.resetSearch());

		expect(cancelSearch).not.toHaveBeenCalled();
		expect(result.current.searchEnabled).toBe(false);
	});
});
