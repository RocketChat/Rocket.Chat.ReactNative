import { type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { act, renderHook } from '@testing-library/react-native';

import { selectServerRequest } from '~/actions/server';
import { createMockedStore } from '~/reducers/mockedStore';
import { useSearch } from '../useSearch';

jest.mock('~/lib/methods/search', () => ({
	searchLocal: jest.fn(() => Promise.resolve([])),
	searchRemote: jest.fn(() => Promise.resolve([]))
}));

const renderSearch = () => {
	const store = createMockedStore();
	const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
	const { result } = renderHook(() => useSearch(), { wrapper });
	const cancelSearch = jest.fn();
	Object.assign(result.current.searchBarRef, { current: { cancelSearch } });
	return { result, store, cancelSearch };
};

describe('RoomsListView useSearch', () => {
	it('cancels the system search bar and leaves search mode when search stops', () => {
		const { result, cancelSearch } = renderSearch();

		act(() => result.current.startSearch());
		expect(result.current.searchEnabled).toBe(true);

		act(() => result.current.stopSearch());

		expect(cancelSearch).toHaveBeenCalledTimes(1);
		expect(result.current.searchEnabled).toBe(false);
	});

	it('leaves search mode without touching the system search bar on reset', () => {
		const { result, cancelSearch } = renderSearch();

		act(() => result.current.startSearch());
		act(() => result.current.resetSearch());

		expect(cancelSearch).not.toHaveBeenCalled();
		expect(result.current.searchEnabled).toBe(false);
	});

	it('stops searching when the server changes', () => {
		const { result, store, cancelSearch } = renderSearch();

		act(() => result.current.startSearch());
		act(() => {
			store.dispatch(selectServerRequest('https://other.server', '7.0.0'));
		});

		expect(cancelSearch).toHaveBeenCalledTimes(1);
		expect(result.current.searchEnabled).toBe(false);
	});
});
