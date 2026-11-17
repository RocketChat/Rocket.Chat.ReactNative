import { act, renderHook } from '@testing-library/react-native';
import { type ReactNode } from 'react';
import { Provider } from 'react-redux';

import { setUser } from '~/actions/login';
import { selectServerSuccess } from '~/actions/server';
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
	store.dispatch(selectServerSuccess({ server: 'https://server-a.com', version: '8.9.0', name: 'A' }));
	store.dispatch(setUser({ id: 'user-a', sidebarCategories: original }));
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

	await act(() => expect(save(renamed)).rejects.toThrow('offline'));

	expect(storedCategories()).toBe(original);
});

it('keeps a newer update when an older save fails after it, and still reports the failure', async () => {
	const firstSave = deferredRejection();
	mockSaveSidebarCategories.mockReturnValueOnce(firstSave.promise as any).mockResolvedValueOnce(undefined as any);
	const { save, storedCategories } = renderSave();

	const first = save(renamed);
	await act(() => save(renamedWithUnreads));
	firstSave.reject(new Error('offline'));
	await act(() => expect(first).rejects.toThrow('offline'));

	expect(storedCategories()).toBe(renamedWithUnreads);
});

it('restores the last accepted categories when two overlapping saves both fail', async () => {
	const firstSave = deferredRejection();
	const secondSave = deferredRejection();
	mockSaveSidebarCategories.mockReturnValueOnce(firstSave.promise as any).mockReturnValueOnce(secondSave.promise as any);
	const { save, storedCategories } = renderSave();

	const first = save(renamed);
	const second = save(renamedWithUnreads);
	firstSave.reject(new Error('offline'));
	await act(() => expect(first).rejects.toThrow('offline'));
	secondSave.reject(new Error('offline'));
	await act(() => expect(second).rejects.toThrow('offline'));

	expect(storedCategories()).toBe(original);
});

it('restores the newest accepted categories when a later save fails', async () => {
	const secondSave = deferredRejection();
	mockSaveSidebarCategories.mockResolvedValueOnce(undefined as any).mockReturnValueOnce(secondSave.promise as any);
	const { save, storedCategories } = renderSave();

	await act(() => save(renamed));
	const second = save(renamedWithUnreads);
	secondSave.reject(new Error('offline'));
	await act(() => expect(second).rejects.toThrow('offline'));

	expect(storedCategories()).toBe(renamed);
});

it('keeps a pending equal resave when the older save fails before it', async () => {
	const firstSave = deferredRejection();
	let resolveResave: () => void = () => {};
	const resave = new Promise<void>(resolve => {
		resolveResave = resolve;
	});
	mockSaveSidebarCategories.mockReturnValueOnce(firstSave.promise as any).mockReturnValueOnce(resave as any);
	const { save, storedCategories } = renderSave();

	const first = save(renamed);
	const pendingResave = save(renamed.map(category => ({ ...category })));
	firstSave.reject(new Error('offline'));
	await act(() => expect(first).rejects.toThrow('offline'));
	resolveResave();
	await act(() => pendingResave);

	expect(storedCategories()).toEqual(renamed);
});

it("restores the current server's categories when a save fails after switching servers", async () => {
	const serverASave = deferredRejection();
	mockSaveSidebarCategories.mockReturnValueOnce(serverASave.promise as any).mockRejectedValueOnce(new Error('offline'));
	const { save, store, storedCategories } = renderSave();
	const serverBCategories = [{ _id: 'home', name: 'Home' }];

	const serverAPending = save(renamed);
	act(() => {
		store.dispatch(selectServerSuccess({ server: 'https://server-b.com', version: '8.9.0', name: 'B' }));
		store.dispatch(setUser({ id: 'user-b', sidebarCategories: serverBCategories }));
	});
	await act(() => expect(save([{ _id: 'home', name: 'House' }])).rejects.toThrow('offline'));
	serverASave.reject(new Error('offline'));
	await act(() => serverAPending);

	expect(storedCategories()).toBe(serverBCategories);
});
