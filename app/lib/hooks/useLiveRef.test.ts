import { renderHook } from '@testing-library/react-native';

import { useLiveRef } from './useLiveRef';

describe('useLiveRef', () => {
	it('exposes the initial value on first render', () => {
		const { result } = renderHook(() => useLiveRef('first'));

		expect(result.current.current).toBe('first');
	});

	it('refreshes ref.current to the latest value on rerender', () => {
		const { result, rerender } = renderHook(({ value }: { value: number }) => useLiveRef(value), { initialProps: { value: 1 } });

		rerender({ value: 2 });

		expect(result.current.current).toBe(2);
	});

	it('keeps a stable ref object identity across rerenders', () => {
		const { result, rerender } = renderHook(({ value }: { value: string }) => useLiveRef(value), {
			initialProps: { value: 'a' }
		});
		const firstRef = result.current;

		rerender({ value: 'b' });

		expect(result.current).toBe(firstRef);
	});
});
