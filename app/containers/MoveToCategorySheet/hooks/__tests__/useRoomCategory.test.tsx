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
jest.mock('~/lib/methods/helpers/log', () => jest.fn());
jest.mock('~/views/CategorySettingsView/utils/alertCategoryError', () => ({ alertCategoryError: jest.fn() }));

const mockSetRoomsCategory = setRoomsCategory as jest.MockedFunction<typeof setRoomsCategory>;
const mockToggleFavorite = toggleFavorite as jest.MockedFunction<typeof toggleFavorite>;

const renderRoomCategory = (room: { rid: string; category?: string; f?: boolean }) => {
	const store = createMockedStore();
	store.dispatch(selectServerSuccess({ server: 'https://open.rocket.chat', version: '8.9.0', name: 'Open' }));
	store.dispatch(setEnterpriseModules([], true));
	store.dispatch(setUser({ sidebarCategories: [{ _id: 'work', name: 'Work' }] }));
	const Wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
	return renderHook(() => useRoomCategory(room), { wrapper: Wrapper }).result;
};

afterEach(() => {
	jest.clearAllMocks();
});

it('unfavorites the room again when leaving its category fails', async () => {
	mockSetRoomsCategory.mockRejectedValueOnce(new Error('forbidden'));
	const result = renderRoomCategory({ rid: 'room1', category: 'work', f: false });

	await act(() => result.current.moveToCategory(FAVORITES_GROUP));

	expect(mockToggleFavorite.mock.calls).toEqual([
		['room1', true],
		['room1', false]
	]);
	expect(alertCategoryError).toHaveBeenCalledWith(expect.objectContaining({ message: 'forbidden' }));
});

it('reports the category error when undoing the favorite also fails', async () => {
	mockSetRoomsCategory.mockRejectedValueOnce(new Error('forbidden'));
	mockToggleFavorite.mockResolvedValueOnce(undefined as any).mockRejectedValueOnce(new Error('offline'));
	const result = renderRoomCategory({ rid: 'room1', category: 'work', f: false });

	await act(() => result.current.moveToCategory(FAVORITES_GROUP));

	expect(alertCategoryError).toHaveBeenCalledWith(expect.objectContaining({ message: 'forbidden' }));
});

it('keeps the favorite when clearing a deleted category fails', async () => {
	mockSetRoomsCategory.mockRejectedValueOnce(new Error('forbidden'));
	const result = renderRoomCategory({ rid: 'room1', category: 'deleted', f: false });

	await act(() => result.current.moveToCategory(FAVORITES_GROUP));

	expect(mockToggleFavorite.mock.calls).toEqual([['room1', true]]);
});

it('moves a categorized room to favorites without leaving it uncategorized in between', async () => {
	const result = renderRoomCategory({ rid: 'room1', category: 'work', f: false });

	await act(() => result.current.moveToCategory(FAVORITES_GROUP));

	expect(mockToggleFavorite).toHaveBeenCalledWith('room1', true);
	expect(mockSetRoomsCategory).toHaveBeenCalledWith(['room1'], null);
	expect(mockToggleFavorite.mock.invocationCallOrder[0]).toBeLessThan(mockSetRoomsCategory.mock.invocationCallOrder[0]);
});
