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

	it('scroll-to-index-failed retries toward the actual target index, not highestMeasuredFrameIndex', async () => {
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

		// Once the frame elapses it must retry toward the ACTUAL target index (3), not
		// highestMeasuredFrameIndex (1).
		act(() => {
			jest.advanceTimersByTime(100);
		});
		expect(scrollToIndex).toHaveBeenCalledTimes(1);
		expect(scrollToIndex).toHaveBeenCalledWith(expect.objectContaining({ index: 3 }));
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

		// The retry must re-apply the same centering + header-clearing offset; otherwise the target lands
		// flush at the top edge and sits hidden behind the room header.
		expect(scrollToIndex).toHaveBeenCalledTimes(1);
		expect(scrollToIndex).toHaveBeenCalledWith(expect.objectContaining({ index: 3, viewPosition: 0.5, viewOffset: 100 }));
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
