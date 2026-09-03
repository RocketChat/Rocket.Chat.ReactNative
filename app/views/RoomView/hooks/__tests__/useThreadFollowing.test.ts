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
	const observeWithColumns = jest.fn(() => ({
		subscribe: (cb: Emit<any>) => {
			emit = cb;
			return { unsubscribe };
		}
	}));
	mockGet.mockImplementation(() => ({ query: () => ({ observeWithColumns }) }));
	return {
		observeWithColumns,
		unsubscribe,
		emitThreads: (threads: any[]) => act(() => emit?.(threads))
	};
};

describe('useThreadFollowing', () => {
	beforeEach(() => jest.clearAllMocks());

	it('reflects whether the user is a replier on the observed thread', () => {
		const observable = setupObservable();
		const { result } = renderHook(() => useThreadFollowing('tmid-1', 'user-1'));

		expect(result.current).toBe(true);

		observable.emitThreads([{ replies: ['user-1', 'other'] }]);
		expect(result.current).toBe(true);

		observable.emitThreads([{ replies: ['other'] }]);
		expect(result.current).toBe(false);

		observable.emitThreads([{ replies: undefined }]);
		expect(result.current).toBe(false);
	});

	it('does not observe without a tmid', () => {
		setupObservable();
		const { result } = renderHook(() => useThreadFollowing(undefined, 'user-1'));

		expect(result.current).toBe(true);
		expect(mockGet).not.toHaveBeenCalled();
	});

	it('observes the replies column of the thread', () => {
		const observable = setupObservable();
		renderHook(() => useThreadFollowing('tmid-1', 'user-1'));

		expect(observable.observeWithColumns).toHaveBeenCalledWith(['replies']);
	});

	it('unsubscribes on unmount', () => {
		const observable = setupObservable();
		const { unmount } = renderHook(() => useThreadFollowing('tmid-1', 'user-1'));

		unmount();
		expect(observable.unsubscribe).toHaveBeenCalledTimes(1);
	});
});
