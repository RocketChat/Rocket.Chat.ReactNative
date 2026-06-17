import { act, renderHook, waitFor } from '@testing-library/react-native';

import { type TAnyMessageModel } from '../../../../definitions';
import { type TListRef, type TMessagesIdsRef } from '../definitions';
import { useScroll } from './useScroll';

type Row = { id: string };

const makeListRef = () => {
	const scrollToIndex = jest.fn();
	const scrollToOffset = jest.fn();
	const scrollToEnd = jest.fn();
	const listRef = { current: { scrollToIndex, scrollToOffset, scrollToEnd } } as unknown as TListRef;
	return { listRef, scrollToIndex, scrollToOffset, scrollToEnd };
};

const makeMessagesIdsRef = (ids: string[]): TMessagesIdsRef => ({ current: ids });

const renderUseScroll = (initialRows: Row[], setHighTs = jest.fn(), fetchMessages = jest.fn()) => {
	const { listRef, scrollToIndex, scrollToOffset, scrollToEnd } = makeListRef();
	const idsRef = makeMessagesIdsRef(initialRows.map(r => r.id));

	const utils = renderHook(
		({ rows }: { rows: Row[] }) => {
			// Keep the ids ref in sync the same way useMessages does (before paint).
			idsRef.current = rows.map(r => r.id);
			return useScroll({
				listRef,
				messages: rows as unknown as TAnyMessageModel[],
				messagesIds: idsRef,
				setHighTs,
				fetchMessages
			});
		},
		{ initialProps: { rows: initialRows } }
	);

	return { ...utils, listRef, scrollToIndex, scrollToOffset, scrollToEnd, idsRef, setHighTs, fetchMessages };
};

describe('useScroll', () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		// Flush the highlight-clear timeout inside act so its setState doesn't warn.
		act(() => {
			jest.runOnlyPendingTimers();
		});
		jest.useRealTimers();
	});

	it('sets the anchor, then scrolls exactly once to the target index after it re-observes', async () => {
		const setHighTs = jest.fn();
		// Target is not in the initial rows; it appears only after the anchor re-observes.
		const { result, rerender, scrollToIndex } = renderUseScroll([{ id: 'live-1' }, { id: 'live-2' }], setHighTs);

		let jumpResolved = false;
		act(() => {
			result.current.jumpToMessage('target', 1500).then(() => {
				jumpResolved = true;
			});
		});

		// Anchor bound was applied.
		expect(setHighTs).toHaveBeenCalledWith(1500);
		// No scroll yet — the target has not appeared in the rendered rows.
		expect(scrollToIndex).not.toHaveBeenCalled();

		// Re-observe: the anchored window emits with the target present at index 1.
		act(() => {
			rerender({ rows: [{ id: 'older' }, { id: 'target' }, { id: 'newer' }] });
		});

		await waitFor(() => {
			expect(scrollToIndex).toHaveBeenCalledTimes(1);
		});
		expect(scrollToIndex).toHaveBeenCalledWith(expect.objectContaining({ index: 1 }));

		await act(async () => {
			jest.runOnlyPendingTimers();
			await Promise.resolve();
		});
		await waitFor(() => expect(jumpResolved).toBe(true));
	});

	it('re-scrolls to the target after measurement so an undershot estimate cannot leave it hidden', async () => {
		const setHighTs = jest.fn();
		const { result, rerender, scrollToIndex } = renderUseScroll([{ id: 'live-1' }, { id: 'live-2' }], setHighTs);

		act(() => {
			result.current.jumpToMessage('target', 1500);
		});
		act(() => {
			rerender({ rows: [{ id: 'older' }, { id: 'target' }, { id: 'newer' }] });
		});

		// First pass: a single scroll toward the target on an ESTIMATED offset (inverted list, no getItemLayout).
		await waitFor(() => expect(scrollToIndex).toHaveBeenCalledTimes(1));
		expect(scrollToIndex).toHaveBeenLastCalledWith(expect.objectContaining({ index: 1, viewPosition: 0.5, viewOffset: 100 }));

		// Second pass: once the row has been measured, a corrective scroll re-centers it to the same spot so an
		// undershooting estimate cannot leave the target hidden above the viewport.
		act(() => {
			jest.advanceTimersByTime(100);
		});
		expect(scrollToIndex).toHaveBeenCalledTimes(2);
		expect(scrollToIndex).toHaveBeenLastCalledWith(expect.objectContaining({ index: 1, viewPosition: 0.5, viewOffset: 100 }));
	});

	it('grows the window (bounded) for a deep anchored target, then scrolls once it appears', async () => {
		const setHighTs = jest.fn();
		const fetchMessages = jest.fn();
		const { result, rerender, scrollToIndex } = renderUseScroll([{ id: 'live-1' }, { id: 'live-2' }], setHighTs, fetchMessages);

		act(() => {
			result.current.jumpToMessage('target', 1500);
		});
		expect(setHighTs).toHaveBeenCalledWith(1500);

		// First re-observe: the anchored window's first page does not reach the target yet → grow one page.
		act(() => {
			rerender({ rows: [{ id: 'p1-a' }, { id: 'p1-b' }] });
		});
		expect(fetchMessages).toHaveBeenCalledTimes(1);
		expect(scrollToIndex).not.toHaveBeenCalled();

		// Still absent after the first growth → grow again.
		act(() => {
			rerender({ rows: [{ id: 'p2-a' }, { id: 'p2-b' }, { id: 'p2-c' }] });
		});
		expect(fetchMessages).toHaveBeenCalledTimes(2);
		expect(scrollToIndex).not.toHaveBeenCalled();

		// The grown window finally includes the target → scroll exactly once, no further growth.
		act(() => {
			rerender({ rows: [{ id: 'older' }, { id: 'target' }, { id: 'newer' }] });
		});
		await waitFor(() => expect(scrollToIndex).toHaveBeenCalledTimes(1));
		expect(scrollToIndex).toHaveBeenCalledWith(expect.objectContaining({ index: 1 }));
		expect(fetchMessages).toHaveBeenCalledTimes(2);
	});

	it('refreshes the safety window on each productive growth so a slow deep target is not aborted mid-load', async () => {
		const setHighTs = jest.fn();
		const fetchMessages = jest.fn();
		const { result, rerender, scrollToIndex } = renderUseScroll([{ id: 'live-1' }], setHighTs, fetchMessages);

		let jumpResolved = false;
		act(() => {
			result.current.jumpToMessage('deep', 1500).then(() => {
				jumpResolved = true;
			});
		});
		expect(setHighTs).toHaveBeenCalledWith(1500);

		// Growth 1: first page loaded, target still absent. Advance just under the budget first; the timer
		// must NOT have fired yet (the old single-budget would fire at 5000 ms total).
		act(() => {
			jest.advanceTimersByTime(4000);
		});
		expect(jumpResolved).toBe(false);
		act(() => {
			rerender({ rows: [{ id: 'p1-a' }] });
		});
		expect(fetchMessages).toHaveBeenCalledTimes(1);

		// Growth 2: advance another 4 s (total 8 s — beyond the original 5 s single budget). Without the
		// per-growth refresh the timer would have fired at 5 s and aborted; with it the window resets each time.
		act(() => {
			jest.advanceTimersByTime(4000);
		});
		expect(jumpResolved).toBe(false);
		act(() => {
			rerender({ rows: [{ id: 'p2-a' }, { id: 'p2-b' }] });
		});
		expect(fetchMessages).toHaveBeenCalledTimes(2);

		// Growth 3: advance another 4 s (total 12 s). Still no abort — each growth refreshed the window.
		act(() => {
			jest.advanceTimersByTime(4000);
		});
		expect(jumpResolved).toBe(false);
		act(() => {
			rerender({ rows: [{ id: 'p3-a' }, { id: 'p3-b' }] });
		});
		expect(fetchMessages).toHaveBeenCalledTimes(3);

		// Target finally arrives — jump must complete, not abort.
		setHighTs.mockClear();
		act(() => {
			rerender({ rows: [{ id: 'older' }, { id: 'deep' }, { id: 'newer' }] });
		});
		await waitFor(() => expect(scrollToIndex).toHaveBeenCalledTimes(1));
		expect(scrollToIndex).toHaveBeenCalledWith(expect.objectContaining({ index: 1 }));
		// abortJump was never called: the anchor was NOT released back to null.
		expect(setHighTs).not.toHaveBeenCalledWith(null);

		await act(async () => {
			jest.runOnlyPendingTimers();
			await Promise.resolve();
		});
		await waitFor(() => expect(jumpResolved).toBe(true));
	});

	it('caps anchored window growth so a never-materialising target stops growing and the safety net aborts', async () => {
		const setHighTs = jest.fn();
		const fetchMessages = jest.fn();
		const { result, rerender, scrollToIndex } = renderUseScroll([{ id: 'live-1' }], setHighTs, fetchMessages);

		let jumpResolved = false;
		act(() => {
			result.current.jumpToMessage('ghost', 1500).then(() => {
				jumpResolved = true;
			});
		});

		// The target never appears. Each re-observe grows the window, but only up to the cap (5).
		for (let i = 0; i < 8; i++) {
			act(() => {
				rerender({ rows: [{ id: `pass-${i}` }] });
			});
		}
		expect(fetchMessages).toHaveBeenCalledTimes(5);
		expect(scrollToIndex).not.toHaveBeenCalled();

		// Growth exhausted → the safety net releases the anchor back to the Live Tail and resolves (never stuck).
		setHighTs.mockClear();
		await act(async () => {
			jest.advanceTimersByTime(5000);
			await Promise.resolve();
		});
		await waitFor(() => expect(jumpResolved).toBe(true));
		expect(setHighTs).toHaveBeenCalledWith(null);
	});

	it('does not grow the window for a non-anchored (contiguous) target that is not yet present', () => {
		const setHighTs = jest.fn();
		const fetchMessages = jest.fn();
		const { result, rerender } = renderUseScroll([{ id: 'live-1' }, { id: 'live-2' }], setHighTs, fetchMessages);

		// Contiguous jump passes highTs = null: there is no Anchored Window to grow, so a missing target
		// must simply wait (or hit the safety net) — never trigger window growth.
		act(() => {
			result.current.jumpToMessage('target', null);
		});
		act(() => {
			rerender({ rows: [{ id: 'live-1' }, { id: 'live-2' }, { id: 'live-3' }] });
		});

		expect(fetchMessages).not.toHaveBeenCalled();
	});

	it('scroll-to-index-failed steps to the measured frontier first, then lands on the actual target index', async () => {
		const setHighTs = jest.fn();
		const { result, rerender, scrollToIndex } = renderUseScroll([{ id: 'live-1' }, { id: 'live-2' }], setHighTs);

		act(() => {
			result.current.jumpToMessage('target', 1500);
		});

		// Re-observe with the target sitting at a mid-window index (far past the initially-rendered rows).
		const rows = [{ id: 'm0' }, { id: 'm1' }, { id: 'm2' }, { id: 'target' }, { id: 'm4' }, { id: 'm5' }];
		act(() => {
			rerender({ rows });
		});
		// The reactive scroll already fired once toward index 3.
		await waitFor(() => expect(scrollToIndex).toHaveBeenCalledTimes(1));
		// It also schedules a corrective re-scroll (undershoot fix); drain it so the failure-retry below is isolated.
		act(() => {
			jest.runOnlyPendingTimers();
		});
		scrollToIndex.mockClear();

		// Simulate the inverted list failing to measure the target's frame: it only measured up to index 1.
		act(() => {
			result.current.handleScrollToIndexFailed({
				index: 3,
				highestMeasuredFrameIndex: 1,
				averageItemLength: 50
			});
		});

		// The retry is deferred one frame to break the synchronous onScrollToIndexFailed recursion, so
		// nothing scrolls within this stack frame.
		expect(scrollToIndex).not.toHaveBeenCalled();

		// First frame: a straight scroll to the unmeasured target would fail without moving the viewport, so
		// the retry steps to the measured frontier (1) — which DOES advance the render window.
		act(() => {
			jest.advanceTimersByTime(50);
		});
		expect(scrollToIndex).toHaveBeenLastCalledWith(expect.objectContaining({ index: 1 }));

		// Next frame: re-attempt the ACTUAL target index (3).
		act(() => {
			jest.advanceTimersByTime(50);
		});
		expect(scrollToIndex).toHaveBeenLastCalledWith(expect.objectContaining({ index: 3 }));
	});

	it('keeps the header-clearing view offset on a scroll-to-index-failed retry so the target is not hidden behind the header', async () => {
		const setHighTs = jest.fn();
		const { result, rerender, scrollToIndex } = renderUseScroll([{ id: 'live-1' }, { id: 'live-2' }], setHighTs);

		act(() => {
			result.current.jumpToMessage('target', 1500);
		});

		const rows = [{ id: 'm0' }, { id: 'm1' }, { id: 'm2' }, { id: 'target' }, { id: 'm4' }, { id: 'm5' }];
		act(() => {
			rerender({ rows });
		});
		// The reactive scroll already landed once, centered and clear of the header.
		await waitFor(() => expect(scrollToIndex).toHaveBeenCalledTimes(1));
		expect(scrollToIndex).toHaveBeenLastCalledWith(expect.objectContaining({ viewPosition: 0.5, viewOffset: 100 }));
		// Drain the corrective re-scroll the reactive effect schedules (undershoot fix) so the retry below stands alone.
		act(() => {
			jest.runOnlyPendingTimers();
		});
		scrollToIndex.mockClear();

		// The inverted list could not measure the target's frame on that first attempt.
		act(() => {
			result.current.handleScrollToIndexFailed({ index: 3, highestMeasuredFrameIndex: 1, averageItemLength: 50 });
		});
		act(() => {
			jest.advanceTimersByTime(100);
		});

		// The landing on the actual target (after the frontier step) must re-apply the same centering +
		// header-clearing offset; otherwise the target lands flush at the top edge and sits hidden behind
		// the room header.
		expect(scrollToIndex).toHaveBeenLastCalledWith(expect.objectContaining({ index: 3, viewPosition: 0.5, viewOffset: 100 }));
	});

	it('defers a scroll-to-index-failed retry and caps it so an unmeasurable target cannot recurse into a stack overflow', () => {
		const setHighTs = jest.fn();
		const { result, rerender, scrollToIndex } = renderUseScroll([{ id: 'live-1' }, { id: 'live-2' }], setHighTs);

		act(() => {
			result.current.jumpToMessage('target', 1500);
		});

		// Target sits at a mid-window index whose frame the inverted list cannot measure yet.
		const rows = [{ id: 'm0' }, { id: 'm1' }, { id: 'm2' }, { id: 'target' }, { id: 'm4' }];
		act(() => {
			rerender({ rows });
		});
		scrollToIndex.mockClear();

		// Model a real VirtualizedList: a scrollToIndex toward an unmeasurable frame re-invokes
		// onScrollToIndexFailed. A synchronous retry would recurse until the call stack overflows; the
		// mock caps its own re-entry so a regression reports a bounded count instead of crashing the worker.
		const info = { index: 3, highestMeasuredFrameIndex: 1, averageItemLength: 50 };
		let reentry = 0;
		scrollToIndex.mockImplementation(() => {
			reentry += 1;
			if (reentry > 100) {
				return;
			}
			result.current.handleScrollToIndexFailed(info);
		});

		// One failure from the list. The fix must defer the retry, so NOTHING scrolls in this stack frame
		// (a synchronous retry would have already recursed here).
		act(() => {
			result.current.handleScrollToIndexFailed(info);
		});
		expect(scrollToIndex).not.toHaveBeenCalled();

		// Drain the deferred retries: each tick may schedule at most one more, and the retry cap guarantees
		// the chain terminates well below the mock's runaway-recursion ceiling.
		for (let i = 0; i < 20; i++) {
			act(() => {
				jest.runOnlyPendingTimers();
			});
		}
		expect(scrollToIndex.mock.calls.length).toBeLessThan(50);
	});

	it('climbs the measured frontier across repeated failures until a deep target lands', () => {
		const setHighTs = jest.fn();
		const { result, rerender, scrollToIndex } = renderUseScroll([{ id: 'live-1' }, { id: 'live-2' }], setHighTs);

		act(() => {
			result.current.jumpToMessage('target', 1500);
		});

		// A deep target: index 8, many rows past the frame the inverted list can initially measure (1).
		const rows = Array.from({ length: 8 }, (_, i) => ({ id: `m${i}` })).concat([{ id: 'target' }]);
		act(() => {
			rerender({ rows });
		});
		act(() => {
			jest.runOnlyPendingTimers();
		});
		scrollToIndex.mockClear();

		// Model a real inverted VirtualizedList: scrolling straight to the still-unmeasured target re-invokes
		// onScrollToIndexFailed with the unchanged frontier, while a scroll to the frontier renders the next
		// batch and advances it. Landing on the target only succeeds once the frontier has climbed to it.
		let frontier = 1;
		let landed = false;
		scrollToIndex.mockImplementation(({ index }: { index: number }) => {
			if (index === 8) {
				if (frontier >= 8) {
					landed = true;
					return;
				}
				result.current.handleScrollToIndexFailed({ index: 8, highestMeasuredFrameIndex: frontier, averageItemLength: 50 });
				return;
			}
			frontier = Math.min(8, frontier + 2);
		});

		act(() => {
			result.current.handleScrollToIndexFailed({ index: 8, highestMeasuredFrameIndex: frontier, averageItemLength: 50 });
		});
		for (let i = 0; i < 40; i++) {
			act(() => {
				jest.runOnlyPendingTimers();
			});
		}

		// Stepping straight to the target every retry (the pre-fix behavior) would exhaust the cap with the
		// frontier still at 1; climbing the frontier first gets the deep target rendered and landed.
		expect(landed).toBe(true);
	});

	it('aborts cleanly and releases the anchor when the target never re-observes within the safety window', async () => {
		const setHighTs = jest.fn();
		const { result, scrollToIndex } = renderUseScroll([{ id: 'live-1' }, { id: 'live-2' }], setHighTs);

		let jumpResolved = false;
		act(() => {
			result.current.jumpToMessage('ghost', 1500).then(() => {
				jumpResolved = true;
			});
		});

		expect(setHighTs).toHaveBeenCalledWith(1500);
		setHighTs.mockClear();

		// The target never appears. After the safety window elapses, the jump must abort: release the
		// Anchored Window back to the Live Tail (setHighTs(null)) and resolve — never leaving a stuck spinner.
		await act(async () => {
			jest.advanceTimersByTime(5000);
			await Promise.resolve();
		});

		await waitFor(() => expect(jumpResolved).toBe(true));
		expect(setHighTs).toHaveBeenCalledWith(null);
		expect(scrollToIndex).not.toHaveBeenCalled();
	});

	it('jump-to-bottom releases the anchor to a Live Window, then scrolls back to live', () => {
		const setHighTs = jest.fn();
		const { result, scrollToOffset } = renderUseScroll([{ id: 'a' }, { id: 'b' }], setHighTs);

		act(() => {
			result.current.jumpToBottom();
		});

		// Release the Anchored Window first (public setter re-seeds to one page — correct for a snap to live),
		// then scroll back to the Live Tail.
		expect(setHighTs).toHaveBeenCalledWith(null);
		expect(scrollToOffset).toHaveBeenCalledWith({ offset: -100 });
	});

	it("does not let a completed jump's deferred re-scroll fire after a newer jump supersedes it", () => {
		const setHighTs = jest.fn();
		// Both targets start present so each jump resolves synchronously (contiguous, non-anchored).
		const { result, rerender, scrollToIndex } = renderUseScroll(
			[{ id: 'a' }, { id: 'target-a' }, { id: 'b' }, { id: 'target-b' }],
			setHighTs
		);

		// Jump A: resolves synchronously; its deferred re-scroll is now queued.
		act(() => {
			result.current.jumpToMessage('target-a', null);
		});
		// Immediate scroll fired once toward A's index (1).
		expect(scrollToIndex).toHaveBeenCalledTimes(1);
		expect(scrollToIndex).toHaveBeenLastCalledWith(expect.objectContaining({ index: 1 }));

		// Jump B: starts before the 50 ms timer fires, updating lastJumpTargetId to 'target-b'.
		act(() => {
			rerender({ rows: [{ id: 'a' }, { id: 'target-a' }, { id: 'b' }, { id: 'target-b' }] });
			result.current.jumpToMessage('target-b', null);
		});
		// Immediate scroll for B fired (target-b is at index 3).
		const callCountAfterBJump = scrollToIndex.mock.calls.length;
		expect(scrollToIndex).toHaveBeenLastCalledWith(expect.objectContaining({ index: 3 }));

		// Advance past 50 ms: A's deferred re-scroll timer fires. The guard must suppress it.
		act(() => {
			jest.advanceTimersByTime(100);
		});

		// Only B's own deferred re-scroll may have fired (also at index 3), never a call to A's index (1).
		const aIndex = 1;
		const staleCallsToA = scrollToIndex.mock.calls.slice(callCountAfterBJump).filter(args => args[0] && args[0].index === aIndex);
		expect(staleCallsToA).toHaveLength(0);
	});

	it('performs a single scroll for a contiguous target already present (no anchor)', async () => {
		const setHighTs = jest.fn();
		// Target is already in the rows; contiguous case passes highTs = null (Live Window).
		const { result, scrollToIndex } = renderUseScroll([{ id: 'a' }, { id: 'target' }, { id: 'c' }], setHighTs);

		let jumpResolved = false;
		act(() => {
			result.current.jumpToMessage('target', null).then(() => {
				jumpResolved = true;
			});
		});

		// No anchor set for a contiguous target.
		expect(setHighTs).not.toHaveBeenCalled();
		// Exactly one scroll, to the present index, synchronously.
		expect(scrollToIndex).toHaveBeenCalledTimes(1);
		expect(scrollToIndex).toHaveBeenCalledWith(expect.objectContaining({ index: 1 }));

		await act(async () => {
			jest.runOnlyPendingTimers();
			await Promise.resolve();
		});
		await waitFor(() => expect(jumpResolved).toBe(true));
	});
});
