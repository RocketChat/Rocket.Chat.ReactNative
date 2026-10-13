import { act, renderHook } from '@testing-library/react-native';
import { type ReactNode } from 'react';
import { Provider } from 'react-redux';

import { setUser } from '~/actions/login';
import { selectServerSuccess } from '~/actions/server';
import { saveSidebarCategories, setRoomsCategory } from '~/lib/services/restApi';
import { createMockedStore } from '~/reducers/mockedStore';
import { useCreateCategory } from '../useCreateCategory';

jest.mock('~/lib/services/restApi', () => ({ saveSidebarCategories: jest.fn(), setRoomsCategory: jest.fn() }));
jest.mock('~/lib/navigation/appNavigation', () => ({ __esModule: true, default: { popTo: jest.fn() } }));

const mockSaveSidebarCategories = saveSidebarCategories as jest.MockedFunction<typeof saveSidebarCategories>;
const mockSetRoomsCategory = setRoomsCategory as jest.MockedFunction<typeof setRoomsCategory>;

const otherServerCategories = [{ _id: 'home', name: 'Home' }];

const deferredSave = () => {
	let resolve: () => void = () => {};
	const promise = new Promise<void>(resolvePromise => {
		resolve = resolvePromise;
	});
	return { promise, resolve };
};

const renderCreate = () => {
	const store = createMockedStore();
	store.dispatch(selectServerSuccess({ server: 'https://a.rocket.chat', version: '8.9.0', name: 'A' }));
	store.dispatch(setUser({ id: 'user-a', sidebarCategories: [] }));
	const Wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
	const { result } = renderHook(() => useCreateCategory(), { wrapper: Wrapper });
	return { store, createCategory: result.current.createCategory };
};

afterEach(() => {
	jest.clearAllMocks();
});

it('saves the categories and assigns the picked rooms', async () => {
	mockSaveSidebarCategories.mockResolvedValueOnce(undefined as any);
	const { store, createCategory } = renderCreate();

	await act(() => createCategory('Work', ['general']));

	expect(store.getState().login.user.sidebarCategories).toContainEqual(expect.objectContaining({ name: 'Work' }));
	expect(mockSetRoomsCategory).toHaveBeenCalledWith(['general'], expect.any(String));
});

it('leaves another server alone when the user switches servers while saving', async () => {
	const save = deferredSave();
	mockSaveSidebarCategories.mockReturnValueOnce(save.promise as any);
	const { store, createCategory } = renderCreate();

	let creating: Promise<void> = Promise.resolve();
	act(() => {
		creating = createCategory('Work', ['general']);
		store.dispatch(selectServerSuccess({ server: 'https://b.rocket.chat', version: '8.9.0', name: 'B' }));
		store.dispatch(setUser({ id: 'user-b', sidebarCategories: otherServerCategories }));
	});
	save.resolve();
	await act(() => creating);

	expect(store.getState().login.user.sidebarCategories).toBe(otherServerCategories);
	expect(mockSetRoomsCategory).not.toHaveBeenCalled();
});
