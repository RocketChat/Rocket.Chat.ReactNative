import { act, renderHook } from '@testing-library/react-native';

import database from '../../../../lib/database';
import { useThreadFollowing } from '../useThreadFollowing';

jest.mock('../../../../lib/database', () => ({
	__esModule: true,
	default: { active: { get: jest.fn() } }
}));

const mockGet = database.active.get as jest.Mock;

type Emit<T> = (value: T) => void;

const setupObservable = () => {
	let emit: Emit<any> | undefined;
	const unsubscribe = jest.fn();
	const subscribe = jest.fn((cb: Emit<any>) => {
		emit = cb;
		return { unsubscribe };
	});
	const threadRecord = { observe: () => ({ subscribe }) };
	mockGet.mockImplementation(() => ({ find: jest.fn(() => Promise.resolve(threadRecord)) }));
	return {
		unsubscribe,
		subscribe,
		emitThread: (thread: any) => act(() => emit?.(thread))
	};
};

const flush = () => act(() => Promise.resolve());

describe('useThreadFollowing', () => {
	beforeEach(() => jest.clearAllMocks());

	it('reflects whether the user is a replier on the observed thread', async () => {
		const observable = setupObservable();
		const { result } = renderHook(() => useThreadFollowing('tmid-1', 'user-1'));

		await flush();
		observable.emitThread({ replies: ['user-1', 'other'] });
		expect(result.current).toBe(true);

		observable.emitThread({ replies: ['other'] });
		expect(result.current).toBe(false);
	});

	it('does not observe without a tmid', async () => {
		setupObservable();
		renderHook(() => useThreadFollowing(undefined, 'user-1'));

		await flush();
		expect(mockGet).not.toHaveBeenCalled();
	});

	it('does not subscribe when unmounted before the thread record resolves', async () => {
		const observable = setupObservable();
		const { unmount } = renderHook(() => useThreadFollowing('tmid-1', 'user-1'));

		unmount();
		await flush();

		expect(observable.subscribe).not.toHaveBeenCalled();
	});

	it('unsubscribes on unmount', async () => {
		const observable = setupObservable();
		const { unmount } = renderHook(() => useThreadFollowing('tmid-1', 'user-1'));

		await flush();
		unmount();
		expect(observable.unsubscribe).toHaveBeenCalledTimes(1);
	});
});
