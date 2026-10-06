import { act, renderHook } from '@testing-library/react-native';
import { Observable, Subject } from 'rxjs';

import { useObservable } from '../useObservable';

describe('useObservable', () => {
	it('returns undefined until the observable emits, then the latest value', () => {
		const subject = new Subject<number>();
		const { result } = renderHook(() => useObservable(subject));

		expect(result.current).toBeUndefined();
		act(() => subject.next(1));
		expect(result.current).toBe(1);
		act(() => subject.next(2));
		expect(result.current).toBe(2);
	});

	it('drops the previous value when the observable changes', () => {
		const first = new Subject<string>();
		const second = new Subject<string>();
		const { result, rerender } = renderHook(({ source }: { source: Subject<string> }) => useObservable(source), {
			initialProps: { source: first }
		});

		act(() => first.next('first'));
		expect(result.current).toBe('first');

		rerender({ source: second });
		expect(result.current).toBeUndefined();
		act(() => second.next('second'));
		expect(result.current).toBe('second');
	});

	it('unsubscribes on unmount', () => {
		const teardown = jest.fn();
		const observable = new Observable<number>(() => teardown);
		const { unmount } = renderHook(() => useObservable(observable));
		expect(teardown).not.toHaveBeenCalled();
		unmount();
		expect(teardown).toHaveBeenCalledTimes(1);
	});

	it('returns undefined without an observable', () => {
		const { result } = renderHook(() => useObservable(undefined));
		expect(result.current).toBeUndefined();
	});
});
