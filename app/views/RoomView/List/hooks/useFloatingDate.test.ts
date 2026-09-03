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
			const shared = {
				animations: [] as any[],
				get: () => current,
				set: (next: any) => {
					if (typeof next === 'number') {
						current = next;
						return;
					}
					shared.animations.push(next);
					if (next.type === 'timing') {
						current = next.toValue;
					}
				}
			};
			ref.current = shared;
			return shared;
		},
		withTiming: (toValue: number, config: { duration: number }) => ({ type: 'timing', toValue, ...config }),
		withDelay: (delay: number, animation: any) => ({ type: 'delay', delay, animation })
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
	const delayedFadeOut = { type: 'delay', delay: 1000, animation: { type: 'timing', toValue: 0, duration: 300 } };

	const animationsOf = (result: any) => (result.current.opacity as any).animations;

	it('keeps viewabilityConfigCallbackPairs identity stable across updates', () => {
		const { result, rerender } = renderHook(() => useFloatingDate());
		const first = result.current.viewabilityConfigCallbackPairs;
		emit(result, [token(0, morning)]);
		rerender({});
		expect(result.current.viewabilityConfigCallbackPairs).toBe(first);
	});

	it('starts hidden', () => {
		const { result } = renderHook(() => useFloatingDate());
		expect(result.current.opacity.get()).toBe(0);
		expect(animationsOf(result)).toEqual([]);
	});

	it('fades in when the user starts dragging', () => {
		const { result } = renderHook(() => useFloatingDate());
		act(() => result.current.scrollEvents.onBeginDrag());
		expect(animationsOf(result)).toEqual([fadeIn]);
		expect(result.current.opacity.get()).toBe(1);
	});

	it('arms the delayed fade out when the drag ends', () => {
		const { result } = renderHook(() => useFloatingDate());
		act(() => result.current.scrollEvents.onBeginDrag());
		act(() => result.current.scrollEvents.onEndDrag());
		expect(animationsOf(result)).toEqual([fadeIn, delayedFadeOut]);
	});

	it('fades out only once the fling that follows the drag settles', () => {
		const { result } = renderHook(() => useFloatingDate());
		act(() => result.current.scrollEvents.onBeginDrag());
		act(() => result.current.scrollEvents.onEndDrag());
		act(() => result.current.scrollEvents.onMomentumBegin());
		act(() => result.current.scrollEvents.onMomentumEnd());
		expect(animationsOf(result)).toEqual([fadeIn, delayedFadeOut, fadeIn, delayedFadeOut]);
	});

	it('restarts the fade in when a new gesture begins during the fade out', () => {
		const { result } = renderHook(() => useFloatingDate());
		act(() => result.current.scrollEvents.onBeginDrag());
		act(() => result.current.scrollEvents.onMomentumEnd());
		act(() => result.current.scrollEvents.onBeginDrag());
		expect(animationsOf(result)).toEqual([fadeIn, delayedFadeOut, fadeIn]);
	});

	it('keeps scrollEvents identity stable across updates', () => {
		const { result, rerender } = renderHook(() => useFloatingDate());
		const first = result.current.scrollEvents;
		emit(result, [token(0, morning)]);
		rerender({});
		expect(result.current.scrollEvents).toBe(first);
	});
});
