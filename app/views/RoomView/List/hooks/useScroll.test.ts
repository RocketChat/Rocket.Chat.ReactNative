import { act, renderHook } from '@testing-library/react-native';

import { useScroll } from './useScroll';

const buildRefs = (ids: string[]) => ({
	listRef: { current: { scrollToIndex: jest.fn(), scrollToEnd: jest.fn(), scrollToOffset: jest.fn() } } as any,
	messagesIds: { current: ids } as any
});

beforeEach(() => {
	jest.useFakeTimers();
});
afterEach(() => {
	jest.useRealTimers();
});

describe('useScroll — jumpToMessage no-progress exit', () => {
	it('gives up after 5 no-progress rounds when history never grows', async () => {
		const ids: string[] = ['a', 'b', 'c'];
		const { listRef, messagesIds } = buildRefs(ids);
		const { result } = renderHook(() => useScroll({ listRef, messagesIds }));

		let done = false;
		const promise = result.current.jumpToMessage('missing');
		promise.then(() => {
			done = true;
		});

		// Round 1: initialises lastLoadedCount (from -1 → 3), noProgressRounds stays 0
		await act(() => jest.advanceTimersByTimeAsync(600));
		expect(done).toBe(false);

		// Rounds 2–5: count stays at 3, noProgressRounds increments each time (4 × 600ms)
		await act(() => jest.advanceTimersByTimeAsync(2400));

		// After round 5 with no progress the loop should have resolved
		await act(() => jest.advanceTimersByTimeAsync(0));
		expect(done).toBe(true);

		// scrollToEnd must not have been called more than 6 times total
		expect(listRef.current.scrollToEnd.mock.calls.length).toBeLessThanOrEqual(6);
	});

	it('keeps retrying while history grows and resolves when the target id appears', async () => {
		const refs = buildRefs(['a', 'b']);
		const { listRef, messagesIds } = refs;
		const { result } = renderHook(() => useScroll({ listRef, messagesIds }));

		let done = false;
		const promise = result.current.jumpToMessage('target');
		promise.then(() => {
			done = true;
		});

		// Each round grows the list then advances one 600ms interval; 6 growth
		// rounds is past the 5-round no-progress threshold, so surviving them
		// proves growth resets the counter.
		const growAndAdvance = (id: string) =>
			act(() => {
				messagesIds.current = [...messagesIds.current, id];
				return jest.advanceTimersByTimeAsync(600);
			});
		await growAndAdvance('extra-0');
		await growAndAdvance('extra-1');
		await growAndAdvance('extra-2');
		await growAndAdvance('extra-3');
		await growAndAdvance('extra-4');
		await growAndAdvance('extra-5');

		// Still pending — has not given up because count kept growing
		expect(done).toBe(false);

		// Now inject the target id and trigger the found-branch
		messagesIds.current = [...messagesIds.current, 'target'];
		await act(() => jest.advanceTimersByTimeAsync(600));

		// scrollToIndex must have been called with the index of 'target'
		const { calls } = listRef.current.scrollToIndex.mock;
		expect(calls.length).toBeGreaterThan(0);
		const [lastCall] = calls[calls.length - 1];
		expect(lastCall.index).toBe(messagesIds.current.indexOf('target'));
	});

	it('cancel still works mid-loop, well before the 5-round threshold', async () => {
		const ids: string[] = ['a'];
		const { listRef, messagesIds } = buildRefs(ids);
		const { result } = renderHook(() => useScroll({ listRef, messagesIds }));

		let done = false;
		const promise = result.current.jumpToMessage('missing');
		promise.then(() => {
			done = true;
		});

		// 2 rounds of no-progress (well below the threshold of 5)
		await act(() => jest.advanceTimersByTimeAsync(600));
		await act(() => jest.advanceTimersByTimeAsync(600));
		expect(done).toBe(false);

		// Cancel the jump
		act(() => {
			result.current.cancelJumpToMessage();
		});

		// One more round — the cancel flag causes early resolve
		await act(() => jest.advanceTimersByTimeAsync(600));
		await act(() => jest.advanceTimersByTimeAsync(0));
		expect(done).toBe(true);

		// Should have resolved via cancel long before the 5-round threshold
		expect(listRef.current.scrollToEnd.mock.calls.length).toBeLessThan(5);
	});

	it('resets counters between jumps so a new jump does not give up immediately', async () => {
		const ids: string[] = ['a', 'b', 'c'];
		const { listRef, messagesIds } = buildRefs(ids);
		const { result } = renderHook(() => useScroll({ listRef, messagesIds }));

		// First jump: exhaust no-progress rounds and give up.
		// Round 1 (init) + rounds 2–5 (no-progress) = 1 + 5 × 600ms advances.
		let firstDone = false;
		const first = result.current.jumpToMessage('missing');
		first.then(() => {
			firstDone = true;
		});

		await act(() => jest.advanceTimersByTimeAsync(600));
		await act(() => jest.advanceTimersByTimeAsync(3000));
		await act(() => jest.advanceTimersByTimeAsync(0));
		expect(firstDone).toBe(true);

		// Grow the list and add the target before the second jump
		messagesIds.current = [...messagesIds.current, 'present'];

		// Second jump: target is already in the list → should scroll immediately
		let secondDone = false;
		const second = result.current.jumpToMessage('present');
		second.then(() => {
			secondDone = true;
		});

		// Inject viewableItems before any timer fires so the first 300ms visibility
		// check sees the message as visible
		act(() => {
			result.current.viewabilityConfigCallbackPairs.current[0].onViewableItemsChanged?.({
				viewableItems: [{ key: 'present', item: {}, index: messagesIds.current.indexOf('present'), isViewable: true }],
				changed: []
			});
		});

		// Advance past the 300ms scroll-animation wait — viewableItems is already
		// populated, so the found-branch resolves immediately
		await act(() => jest.advanceTimersByTimeAsync(300));
		await act(() => jest.advanceTimersByTimeAsync(0));
		expect(secondDone).toBe(true);

		// scrollToIndex must have been called for the second jump — counters did not cause early exit
		const { calls: indexCalls } = listRef.current.scrollToIndex.mock;
		expect(indexCalls.length).toBeGreaterThan(0);
	});
});
