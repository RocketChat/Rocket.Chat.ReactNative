import { act, renderHook } from '@testing-library/react-native';
import { type ReactNode } from 'react';
import { Provider } from 'react-redux';

import { setUser } from '~/actions/login';
import { selectServerSuccess } from '~/actions/server';
import { showConfirmationAlert, showErrorAlert } from '~/lib/methods/helpers/info';
import { saveSidebarCategories, setRoomsCategory } from '~/lib/services/restApi';
import { createMockedStore } from '~/reducers/mockedStore';
import { useDeleteCategory } from '../useDeleteCategory';

jest.mock('~/lib/services/restApi', () => ({ saveSidebarCategories: jest.fn(), setRoomsCategory: jest.fn() }));
jest.mock('~/lib/methods/helpers/info', () => ({ showConfirmationAlert: jest.fn(), showErrorAlert: jest.fn() }));
jest.mock('~/lib/methods/helpers/log', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('~/lib/navigation/appNavigation', () => ({ __esModule: true, default: { popTo: jest.fn() } }));
jest.mock('@react-navigation/native', () => ({
	...jest.requireActual('@react-navigation/native'),
	useNavigation: () => ({ dispatch: jest.fn() })
}));

const mockSaveSidebarCategories = saveSidebarCategories as jest.MockedFunction<typeof saveSidebarCategories>;
const mockSetRoomsCategory = setRoomsCategory as jest.MockedFunction<typeof setRoomsCategory>;
const mockShowConfirmationAlert = showConfirmationAlert as jest.MockedFunction<typeof showConfirmationAlert>;

const work = { _id: 'work', name: 'Work' };
const otherServerCategories = [{ _id: 'home', name: 'Home' }];

const deferredRequest = () => {
	let resolve: () => void = () => {};
	const promise = new Promise<void>(resolvePromise => {
		resolve = resolvePromise;
	});
	return { promise, resolve };
};

const renderDelete = () => {
	const store = createMockedStore();
	store.dispatch(selectServerSuccess({ server: 'https://a.rocket.chat', version: '8.9.0', name: 'A' }));
	store.dispatch(setUser({ id: 'user-a', sidebarCategories: [work] }));
	const Wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
	const { result } = renderHook(() => useDeleteCategory(work, ['general']), { wrapper: Wrapper });
	const confirmDelete = () => {
		result.current();
		const deleteAndLeave = mockShowConfirmationAlert.mock.calls[0][0].onPress as () => Promise<void>;
		return deleteAndLeave();
	};
	return { store, confirmDelete };
};

afterEach(() => {
	jest.clearAllMocks();
});

it('removes the category and clears it from its rooms', async () => {
	mockSaveSidebarCategories.mockResolvedValueOnce(undefined as any);
	const { store, confirmDelete } = renderDelete();

	await act(() => confirmDelete());

	expect(store.getState().login.user.sidebarCategories).toEqual([]);
	expect(mockSetRoomsCategory).toHaveBeenCalledWith(['general'], null);
	expect(mockSetRoomsCategory.mock.invocationCallOrder[0]).toBeLessThan(mockSaveSidebarCategories.mock.invocationCallOrder[0]);
});

it('leaves another server alone when the user switches servers while deleting', async () => {
	const clearRooms = deferredRequest();
	mockSetRoomsCategory.mockReturnValueOnce(clearRooms.promise as any);
	const { store, confirmDelete } = renderDelete();

	let deleting: Promise<void> = Promise.resolve();
	act(() => {
		deleting = confirmDelete();
		store.dispatch(selectServerSuccess({ server: 'https://b.rocket.chat', version: '8.9.0', name: 'B' }));
		store.dispatch(setUser({ id: 'user-b', sidebarCategories: otherServerCategories }));
	});
	clearRooms.resolve();
	await act(() => deleting);

	expect(store.getState().login.user.sidebarCategories).toBe(otherServerCategories);
	expect(mockSaveSidebarCategories).not.toHaveBeenCalled();
});

it('keeps the category when its rooms cannot be cleared', async () => {
	mockSetRoomsCategory.mockRejectedValueOnce(new Error('network'));
	const { store, confirmDelete } = renderDelete();

	await act(() => confirmDelete());

	expect(store.getState().login.user.sidebarCategories).toEqual([work]);
	expect(mockSaveSidebarCategories).not.toHaveBeenCalled();
	expect(showErrorAlert).toHaveBeenCalledWith('network', expect.any(String));
});
