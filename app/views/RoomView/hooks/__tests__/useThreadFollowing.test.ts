import { act, renderHook } from '@testing-library/react-native';

import database from '../../../../lib/database';
import { useThreadFollowing } from '../useThreadFollowing';

jest.mock('../../../../lib/database', () => ({
	__esModule: true,
	default: { active: { get: jest.fn() } }
}));

const mockGet = database.active.get as jest.Mock;

type Emit<T> = (value: T) => void;

const setupObservable = ({ deferFind = false }: { deferFind?: boolean } = {}) => {
	let emit: Emit<any> | undefined;
	let resolveFind: (() => void) | undefined;
	let openSubscriptions = 0;
	const unsubscribe = jest.fn(() => {
		openSubscriptions -= 1;
	});
	const threadRecord = {
		observe: () => ({
			subscribe: (cb: Emit<any>) => {
				emit = cb;
				openSubscriptions += 1;
				return { unsubscribe };
			}
		})
	};
	mockGet.mockImplementation(() => ({
		find: jest.fn(
			() =>
				new Promise(resolve => {
					if (deferFind) {
						resolveFind = () => resolve(threadRecord);
						return;
					}
					resolve(threadRecord);
				})
		)
	}));
	return {
		unsubscribe,
		openSubscriptions: () => openSubscriptions,
		resolveFind: () => resolveFind?.(),
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

	it('unsubscribes on unmount', async () => {
		const observable = setupObservable();
		const { unmount } = renderHook(() => useThreadFollowing('tmid-1', 'user-1'));

		await flush();
		unmount();
		expect(observable.unsubscribe).toHaveBeenCalledTimes(1);
	});

	it('leaves no observer open when the record resolves after unmount', async () => {
		const observable = setupObservable({ deferFind: true });
		const { unmount } = renderHook(() => useThreadFollowing('tmid-1', 'user-1'));

		unmount();
		observable.resolveFind();
		await flush();

		expect(observable.openSubscriptions()).toBe(0);
	});
});
