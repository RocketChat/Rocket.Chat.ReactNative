import { act, renderHook } from '@testing-library/react-native';
import { type ReactNode } from 'react';
import { Provider } from 'react-redux';

import { setUser } from '~/actions/login';
import { saveSidebarCategories } from '~/lib/services/restApi';
import { createMockedStore } from '~/reducers/mockedStore';
import { useSaveSidebarCategories } from '../useSaveSidebarCategories';

jest.mock('~/lib/services/restApi', () => ({ saveSidebarCategories: jest.fn() }));

const mockSaveSidebarCategories = saveSidebarCategories as jest.MockedFunction<typeof saveSidebarCategories>;

const original = [{ _id: 'work', name: 'Work' }];
const renamed = [{ _id: 'work', name: 'Office' }];
const renamedWithUnreads = [{ _id: 'work', name: 'Office', showUnreads: true }];

const renderSave = () => {
	const store = createMockedStore();
	store.dispatch(setUser({ sidebarCategories: original }));
	const Wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
	const { result } = renderHook(() => useSaveSidebarCategories(), { wrapper: Wrapper });
	const storedCategories = () => store.getState().login.user.sidebarCategories;
	return { save: result.current, store, storedCategories };
};

const deferredRejection = () => {
	let reject: (error: Error) => void = () => {};
	const promise = new Promise<void>((_resolve, rejectPromise) => {
		reject = rejectPromise;
	});
	return { promise, reject };
};

afterEach(() => {
	jest.clearAllMocks();
});

it('restores the previous categories when the save fails', async () => {
	mockSaveSidebarCategories.mockRejectedValueOnce(new Error('offline'));
	const { save, storedCategories } = renderSave();

	await act(() => expect(save(renamed, original)).rejects.toThrow('offline'));

	expect(storedCategories()).toBe(original);
});

it('keeps a newer update when an older save fails after it', async () => {
	const firstSave = deferredRejection();
	mockSaveSidebarCategories.mockReturnValueOnce(firstSave.promise as any).mockResolvedValueOnce(undefined as any);
	const { save, storedCategories } = renderSave();

	const first = save(renamed, original);
	await act(() => save(renamedWithUnreads, renamed));
	firstSave.reject(new Error('offline'));
	await act(() => expect(first).rejects.toThrow('offline'));

	expect(storedCategories()).toBe(renamedWithUnreads);
});
