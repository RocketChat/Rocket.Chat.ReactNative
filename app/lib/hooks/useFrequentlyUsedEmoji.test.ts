import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useFrequentlyUsedEmoji } from './useFrequentlyUsedEmoji';
import { getFrequentlyUsedEmojis } from '../methods/emojis';
import { type IEmoji } from '../../definitions';

// jest.setup.js stubs this hook globally for component tests; use the real one here.
jest.mock('./useFrequentlyUsedEmoji', () => jest.requireActual('./useFrequentlyUsedEmoji'));
jest.mock('../methods/emojis', () => ({
	getFrequentlyUsedEmojis: jest.fn()
}));

const mockedGetFrequentlyUsedEmojis = jest.mocked(getFrequentlyUsedEmojis);

const createDeferred = <T>() => {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>(res => {
		resolve = res;
	});

	return { promise, resolve };
};

describe('useFrequentlyUsedEmoji', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('starts unloaded, then exposes the fetched emojis and flips loaded', async () => {
		const deferred = createDeferred<IEmoji[]>();
		mockedGetFrequentlyUsedEmojis.mockReturnValue(deferred.promise);

		const { result } = renderHook(() => useFrequentlyUsedEmoji());

		expect(result.current).toEqual({ frequentlyUsed: [], loaded: false });

		await act(async () => {
			deferred.resolve(['grinning']);
			await deferred.promise;
		});

		await waitFor(() => expect(result.current.loaded).toBe(true));
		expect(result.current.frequentlyUsed).toEqual(['grinning']);
		expect(mockedGetFrequentlyUsedEmojis).toHaveBeenCalledWith(false);
	});

	it('refetches when withDefaultEmojis changes', async () => {
		mockedGetFrequentlyUsedEmojis.mockResolvedValue([]);

		const { result, rerender } = renderHook(
			({ withDefaults }: { withDefaults: boolean }) => useFrequentlyUsedEmoji(withDefaults),
			{
				initialProps: { withDefaults: false }
			}
		);

		await waitFor(() => expect(result.current.loaded).toBe(true));
		expect(mockedGetFrequentlyUsedEmojis).toHaveBeenCalledWith(false);

		rerender({ withDefaults: true });

		await waitFor(() => expect(mockedGetFrequentlyUsedEmojis).toHaveBeenCalledWith(true));
		expect(mockedGetFrequentlyUsedEmojis).toHaveBeenCalledTimes(2);
	});
});
