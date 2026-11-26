import { act, renderHook } from '@testing-library/react-native';
import { type ReactNode } from 'react';
import { Provider } from 'react-redux';

import { setEnterpriseModules } from '~/actions/enterpriseModules';
import { setUser } from '~/actions/login';
import { selectServerSuccess } from '~/actions/server';
import { showErrorAlert } from '~/lib/methods/helpers/info';
import { saveSidebarCategories } from '~/lib/services/restApi';
import { createMockedStore } from '~/reducers/mockedStore';
import { useCategoryOrder } from '../useCategoryOrder';

jest.mock('~/lib/services/restApi', () => ({ saveSidebarCategories: jest.fn() }));
jest.mock('~/lib/methods/helpers/info', () => ({ showErrorAlert: jest.fn() }));
jest.mock('~/lib/methods/helpers/log', () => ({ __esModule: true, default: jest.fn() }));

const work = { _id: 'work', name: 'Work' };
const home = { _id: 'home', name: 'Home' };

const deferredRejection = () => {
	let reject: (error: Error) => void = () => {};
	const promise = new Promise<void>((_resolve, rejectPromise) => {
		reject = rejectPromise;
	});
	return { promise, reject };
};

const renderCategoryOrder = () => {
	const store = createMockedStore();
	store.dispatch(selectServerSuccess({ server: 'https://a.rocket.chat', version: '8.9.0', name: 'A' }));
	store.dispatch(setEnterpriseModules([], true));
	store.dispatch(setUser({ id: 'user-a', sidebarCategories: [work, home] }));
	const Wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
	const { result } = renderHook(() => useCategoryOrder(), { wrapper: Wrapper });
	return { store, result };
};

afterEach(() => {
	jest.clearAllMocks();
});

it('tells the user when the new order cannot be saved', async () => {
	jest.mocked(saveSidebarCategories).mockRejectedValueOnce(new Error('network'));
	const { store, result } = renderCategoryOrder();
	const movedIds = result.current.movableGroups.map(group => group.id).reverse();

	await act(() => result.current.saveOrder(movedIds));

	expect(saveSidebarCategories).toHaveBeenCalledTimes(1);
	expect(store.getState().login.user.sidebarCategories).toEqual([work, home]);
	expect(showErrorAlert).toHaveBeenCalledWith('network', expect.any(String));
});

it('stays quiet when a failed order was already replaced by a newer saved order', async () => {
	const firstSave = deferredRejection();
	jest
		.mocked(saveSidebarCategories)
		.mockReturnValueOnce(firstSave.promise as any)
		.mockResolvedValueOnce(undefined as any);
	const { result } = renderCategoryOrder();
	const originalIds = result.current.movableGroups.map(group => group.id);

	const first = result.current.saveOrder([...originalIds].reverse());
	await act(() => result.current.saveOrder(originalIds));
	firstSave.reject(new Error('network'));
	await act(() => first);

	expect(showErrorAlert).not.toHaveBeenCalled();
});
