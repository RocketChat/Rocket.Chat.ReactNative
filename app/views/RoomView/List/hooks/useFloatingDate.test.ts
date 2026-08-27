import { act, renderHook } from '@testing-library/react-native';

import { getHighestIndexViewableTs, useFloatingDate } from './useFloatingDate';

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

	it('clears ts when nothing dated is viewable', () => {
		const { result } = renderHook(() => useFloatingDate());
		emit(result, [token(0, morning)]);
		emit(result, []);
		expect(result.current.ts).toBeNull();
	});

	it('keeps viewabilityConfigCallbackPairs identity stable across updates', () => {
		const { result, rerender } = renderHook(() => useFloatingDate());
		const first = result.current.viewabilityConfigCallbackPairs;
		emit(result, [token(0, morning)]);
		rerender({});
		expect(result.current.viewabilityConfigCallbackPairs).toBe(first);
	});
});
