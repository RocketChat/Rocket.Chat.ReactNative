import { act, renderHook } from '@testing-library/react-native';
import { type ReactNode } from 'react';
import { Provider } from 'react-redux';

import { setEnterpriseModules } from '~/actions/enterpriseModules';
import { setUser } from '~/actions/login';
import { selectServerSuccess } from '~/actions/server';
import { setRoomsCategory, toggleFavorite } from '~/lib/services/restApi';
import { createMockedStore } from '~/reducers/mockedStore';
import { alertCategoryError } from '~/views/CategorySettingsView/utils/alertCategoryError';
import { FAVORITES_GROUP } from '~/views/RoomsListView/utils/sidebarGroupOrder';
import { useRoomCategory } from '../useRoomCategory';

jest.mock('~/lib/services/restApi', () => ({
	setRoomsCategory: jest.fn(() => Promise.resolve()),
	toggleFavorite: jest.fn(() => Promise.resolve())
}));
jest.mock('~/views/CategorySettingsView/utils/alertCategoryError', () => ({ alertCategoryError: jest.fn() }));

const mockSetRoomsCategory = setRoomsCategory as jest.MockedFunction<typeof setRoomsCategory>;
const mockToggleFavorite = toggleFavorite as jest.MockedFunction<typeof toggleFavorite>;

const renderRoomCategory = (room: { rid: string; category?: string; f?: boolean }) => {
	const store = createMockedStore();
	store.dispatch(selectServerSuccess({ server: 'https://open.rocket.chat', version: '8.9.0', name: 'Open' }));
	store.dispatch(setEnterpriseModules([], true));
	store.dispatch(setUser({ sidebarCategories: [{ _id: 'work', name: 'Work' }] }));
	const Wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
	const { result } = renderHook(() => useRoomCategory(room), { wrapper: Wrapper });
	return { result, store };
};

afterEach(() => {
	jest.clearAllMocks();
});

it('moves a categorized room to favorites with only the favorite call', async () => {
	const { result } = renderRoomCategory({ rid: 'room1', category: 'work', f: false });

	await act(() => result.current.moveToCategory(FAVORITES_GROUP));

	expect(mockToggleFavorite.mock.calls).toEqual([['room1', true]]);
	expect(mockSetRoomsCategory).not.toHaveBeenCalled();
});

it('takes a favorited room out of favorites with only the unfavorite call', async () => {
	const { result } = renderRoomCategory({ rid: 'room1', f: true });

	await act(() => result.current.moveToCategory(FAVORITES_GROUP));

	expect(mockToggleFavorite.mock.calls).toEqual([['room1', false]]);
	expect(mockSetRoomsCategory).not.toHaveBeenCalled();
});

it('reports the error and leaves the category alone when favoriting fails', async () => {
	mockToggleFavorite.mockRejectedValueOnce(new Error('forbidden'));
	const { result } = renderRoomCategory({ rid: 'room1', category: 'work', f: false });

	await act(() => result.current.moveToCategory(FAVORITES_GROUP));

	expect(alertCategoryError).toHaveBeenCalledWith(expect.objectContaining({ message: 'forbidden' }));
	expect(mockSetRoomsCategory).not.toHaveBeenCalled();
});

it('turns on the Categories display option when a room moves into a custom category', async () => {
	const { result, store } = renderRoomCategory({ rid: 'room1', f: false });

	await act(() => result.current.moveToCategory('work'));

	expect(store.getState().sortPreferences.groupByType).toBe(true);
});

it('leaves the Categories display option off when a room leaves its custom category', async () => {
	const { result, store } = renderRoomCategory({ rid: 'room1', category: 'work', f: false });

	await act(() => result.current.moveToCategory('work'));

	expect(mockSetRoomsCategory).toHaveBeenCalledWith(['room1'], null);
	expect(store.getState().sortPreferences.groupByType).toBe(false);
});

it('leaves the Categories display option off when a room moves to favorites', async () => {
	const { result, store } = renderRoomCategory({ rid: 'room1', category: 'work', f: false });

	await act(() => result.current.moveToCategory(FAVORITES_GROUP));

	expect(store.getState().sortPreferences.groupByType).toBe(false);
});

it('leaves the Categories display option off when moving fails', async () => {
	mockSetRoomsCategory.mockRejectedValueOnce(new Error('forbidden'));
	const { result, store } = renderRoomCategory({ rid: 'room1', f: false });

	await act(() => result.current.moveToCategory('work'));

	expect(store.getState().sortPreferences.groupByType).toBe(false);
});
