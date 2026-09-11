import { act, renderHook } from '@testing-library/react-native';

import { getHighestIndexViewableTs, useFloatingDate } from './useFloatingDate';

// The global reanimated mock hands back a plain `{ value }`, which cannot record what the hook animates to.
// Model just enough of valueSetter to assert the lifecycle: a new animation cancels the pending one, and a
// timing to the value already held resolves immediately.
jest.mock('react-native-reanimated', () => {
	const actual = jest.requireActual('react-native-reanimated/mock');
	return {
		...actual,
		useSharedValue: (initial: number) => {
			const { useRef } = jest.requireActual('react') as { useRef: <T>(initial: T) => { current: T } };
			const ref = useRef<any>(null);
			if (ref.current) {
				return ref.current;
			}
			let current = initial;
			const animations: any[] = [];
			const shared = {
				animations,
				get value() {
					return current;
				},
				set value(next: any) {
					if (typeof next === 'number') {
						current = next;
						return;
					}
					animations.push(next);
					if (next.type === 'timing') {
						current = next.toValue;
					}
				}
			};
			ref.current = shared;
			return shared;
		},
		withTiming: (toValue: number, config: { duration: number }) => ({ type: 'timing', toValue, ...config })
	};
});

const token = (index: number, ts: Date | null, isViewable = true) =>
	({ index, isViewable, key: String(index), item: ts ? { ts } : null }) as any;

describe('getHighestIndexViewableTs', () => {
	const older = new Date('2017-11-09T10:00:00.000Z');
	const newer = new Date('2017-11-10T10:00:00.000Z');

	it('returns null when there are no viewable items', () => {
		expect(getHighestIndexViewableTs([])).toBeNull();
	});

	it('returns the ts of the highest index', () => {
		expect(getHighestIndexViewableTs([token(0, newer), token(1, older)])).toBe(older);
	});

	it('ignores non viewable items', () => {
		expect(getHighestIndexViewableTs([token(0, newer), token(1, older, false)])).toBe(newer);
	});

	it('ignores items without ts', () => {
		expect(getHighestIndexViewableTs([token(0, newer), token(1, null)])).toBe(newer);
	});
});

const HIDE_DELAY_MS = 1000;

describe('useFloatingDate', () => {
	const morning = new Date('2017-11-10T09:00:00.000Z');
	const evening = new Date('2017-11-10T21:00:00.000Z');
	const dayBefore = new Date('2017-11-09T10:00:00.000Z');

	const emit = (result: any, viewableItems: any[]) =>
		act(() => {
			result.current.viewabilityConfigCallbackPairs[0].onViewableItemsChanged({ viewableItems, changed: [] });
		});

	it('tracks the highest index viewable row', () => {
		const { result } = renderHook(() => useFloatingDate());
		emit(result, [token(0, evening), token(1, morning)]);
		expect(result.current.ts).toBe(morning);
	});

	it('keeps ts while the highest index row stays on the same day', () => {
		const { result } = renderHook(() => useFloatingDate());
		emit(result, [token(0, evening), token(1, morning)]);
		emit(result, [token(0, morning), token(1, evening)]);
		expect(result.current.ts).toBe(morning);
	});

	it('updates ts when the highest index row crosses a day boundary', () => {
		const { result } = renderHook(() => useFloatingDate());
		emit(result, [token(0, morning)]);
		emit(result, [token(0, dayBefore)]);
		expect(result.current.ts).toBe(dayBefore);
	});

	it('keeps the last ts when nothing dated is viewable, so the pill does not flicker', () => {
		const { result } = renderHook(() => useFloatingDate());
		emit(result, [token(0, morning)]);
		emit(result, []);
		expect(result.current.ts).toBe(morning);
	});

	it('does not resurrect a stale day after an empty batch on the same day', () => {
		const { result } = renderHook(() => useFloatingDate());
		emit(result, [token(0, morning)]);
		emit(result, []);
		emit(result, [token(0, evening)]);
		expect(result.current.ts).toBe(morning);
	});

	const fadeIn = { type: 'timing', toValue: 1, duration: 150 };
	const fadeOut = { type: 'timing', toValue: 0, duration: 300 };

	const animationsOf = (result: any) => (result.current.opacity as any).animations;
	const settle = (ms: number) => act(() => jest.advanceTimersByTime(ms));

	it('keeps viewabilityConfigCallbackPairs identity stable across updates', () => {
		const { result, rerender } = renderHook(() => useFloatingDate());
		const first = result.current.viewabilityConfigCallbackPairs;
		emit(result, [token(0, morning)]);
		rerender({});
		expect(result.current.viewabilityConfigCallbackPairs).toBe(first);
	});

	describe('fade lifecycle', () => {
		beforeEach(() => jest.useFakeTimers());
		afterEach(() => jest.useRealTimers());

		it('starts hidden', () => {
			const { result } = renderHook(() => useFloatingDate());
			expect(result.current.opacity.value).toBe(0);
			expect(animationsOf(result)).toEqual([]);
		});

		it('fades in when the user starts dragging', () => {
			const { result } = renderHook(() => useFloatingDate());
			act(() => result.current.scrollEvents.onBeginDrag());
			expect(animationsOf(result)).toEqual([fadeIn]);
			expect(result.current.opacity.value).toBe(1);
		});

		// A fling emits spurious onMomentumEnd/onMomentumBegin pairs mid-gesture on Android near the live
		// tail; re-issuing the fade-in on each one used to restart it from its current value, so opacity
		// crept towards 1 without arriving.
		it('issues the fade in once across a momentum event storm', () => {
			const { result } = renderHook(() => useFloatingDate());
			act(() => result.current.scrollEvents.onBeginDrag());
			for (let i = 0; i < 20; i++) {
				act(() => result.current.scrollEvents.onMomentumEnd());
				act(() => result.current.scrollEvents.onMomentumBegin());
			}
			expect(animationsOf(result)).toEqual([fadeIn]);
			expect(result.current.opacity.value).toBe(1);
		});

		it('holds at full opacity until the settle delay elapses', () => {
			const { result } = renderHook(() => useFloatingDate());
			act(() => result.current.scrollEvents.onBeginDrag());
			act(() => result.current.scrollEvents.onEndDrag());
			settle(999);
			expect(animationsOf(result)).toEqual([fadeIn]);
			settle(1);
			expect(animationsOf(result)).toEqual([fadeIn, fadeOut]);
			expect(result.current.opacity.value).toBe(0);
		});

		it('re-arms the settle delay so the fling that follows a drag keeps the pill up', () => {
			const { result } = renderHook(() => useFloatingDate());
			act(() => result.current.scrollEvents.onBeginDrag());
			act(() => result.current.scrollEvents.onEndDrag());
			settle(500);
			act(() => result.current.scrollEvents.onMomentumBegin());
			act(() => result.current.scrollEvents.onMomentumEnd());
			settle(999);
			expect(animationsOf(result)).toEqual([fadeIn]);
			settle(1);
			expect(animationsOf(result)).toEqual([fadeIn, fadeOut]);
		});

		it('cancels the pending fade out when scrolling resumes', () => {
			const { result } = renderHook(() => useFloatingDate());
			act(() => result.current.scrollEvents.onBeginDrag());
			act(() => result.current.scrollEvents.onEndDrag());
			settle(500);
			act(() => result.current.scrollEvents.onBeginDrag());
			settle(5000);
			expect(animationsOf(result)).toEqual([fadeIn]);
			expect(result.current.opacity.value).toBe(1);
		});

		it('fades in again after a completed fade out', () => {
			const { result } = renderHook(() => useFloatingDate());
			act(() => result.current.scrollEvents.onBeginDrag());
			act(() => result.current.scrollEvents.onEndDrag());
			settle(HIDE_DELAY_MS);
			act(() => result.current.scrollEvents.onBeginDrag());
			expect(animationsOf(result)).toEqual([fadeIn, fadeOut, fadeIn]);
			expect(result.current.opacity.value).toBe(1);
		});

		it('drops the pending fade out on unmount', () => {
			const { result, unmount } = renderHook(() => useFloatingDate());
			act(() => result.current.scrollEvents.onBeginDrag());
			act(() => result.current.scrollEvents.onEndDrag());
			unmount();
			settle(5000);
			expect(animationsOf(result)).toEqual([fadeIn]);
		});
	});

	it('keeps scrollEvents identity stable across updates', () => {
		const { result, rerender } = renderHook(() => useFloatingDate());
		const first = result.current.scrollEvents;
		emit(result, [token(0, morning)]);
		rerender({});
		expect(result.current.scrollEvents).toBe(first);
	});
});
