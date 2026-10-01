import { renderHook } from '@testing-library/react-native';

import { usePrevious } from '../usePrevious';

describe('usePrevious', () => {
	it('returns the initial value on the first render', () => {
		const { result } = renderHook(() => usePrevious('first'));

		expect(result.current).toBe('first');
	});

	it('returns the value from before the last change', () => {
		const { result, rerender } = renderHook(({ value }: { value: string }) => usePrevious(value), {
			initialProps: { value: 'first' }
		});

		rerender({ value: 'second' });
		expect(result.current).toBe('first');

		rerender({ value: 'third' });
		expect(result.current).toBe('second');
	});

	it('keeps the value from before the last change when rerendered with the same value', () => {
		const { result, rerender } = renderHook(({ value }: { value: string }) => usePrevious(value), {
			initialProps: { value: 'first' }
		});

		rerender({ value: 'second' });
		rerender({ value: 'second' });
		expect(result.current).toBe('first');
	});

	it('settles on NaN instead of re-rendering forever', () => {
		const { result, rerender } = renderHook(({ value }: { value: number }) => usePrevious(value), {
			initialProps: { value: 1 }
		});

		rerender({ value: NaN });
		rerender({ value: NaN });
		expect(result.current).toBe(1);
	});
});
