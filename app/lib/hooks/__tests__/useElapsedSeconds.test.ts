import { act, renderHook } from '@testing-library/react-native';

import { useElapsedSeconds } from '../useElapsedSeconds';

describe('useElapsedSeconds', () => {
	beforeEach(() => {
		jest.useFakeTimers().setSystemTime(10_000);
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('counts nothing until there is a start', () => {
		const { result } = renderHook(() => useElapsedSeconds(undefined));

		expect(result.current).toBe(0);
	});

	it('counts whole seconds from the start', () => {
		const { result } = renderHook(() => useElapsedSeconds(10_000));

		act(() => {
			jest.advanceTimersByTime(3_400);
		});

		expect(result.current).toBe(3);
	});

	it('picks up a call that connected before the screen appeared', () => {
		const { result } = renderHook(() => useElapsedSeconds(10_000 - 65_000));

		expect(result.current).toBe(65);
	});

	it('starts over for a different call', () => {
		const { result, rerender } = renderHook(({ startedAt }: { startedAt?: number }) => useElapsedSeconds(startedAt), {
			initialProps: { startedAt: 10_000 - 30_000 }
		});

		rerender({ startedAt: 10_000 });

		expect(result.current).toBe(0);
	});

	it('leaves no timer running once the screen is gone', () => {
		const { unmount } = renderHook(() => useElapsedSeconds(10_000));
		expect(jest.getTimerCount()).toBe(1);

		unmount();

		expect(jest.getTimerCount()).toBe(0);
	});
});
