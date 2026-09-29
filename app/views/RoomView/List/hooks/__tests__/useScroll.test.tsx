import { act, renderHook, waitFor } from '@testing-library/react-native';

import { type TAnyMessageModel } from '~/definitions';
import { type TListRef, type TMessagesIdsRef } from '~/views/RoomView/definitions';
import { useScroll } from '../useScroll';

type Row = { id: string };

const makeListRef = () => {
	const scrollToIndex = jest.fn();
	const scrollToOffset = jest.fn();
	const scrollToEnd = jest.fn();
	const listRef = { current: { scrollToIndex, scrollToOffset, scrollToEnd } } as unknown as TListRef;
	return { listRef, scrollToIndex, scrollToOffset, scrollToEnd };
};

const makeMessagesIdsRef = (ids: string[]): TMessagesIdsRef => ({ current: ids });

const renderUseScroll = (
	initialRows: Row[],
	setHighTs = jest.fn(),
	fetchMessages = jest.fn(() => Promise.resolve()),
	initialHighTs: number | null = null
) => {
	const { listRef, scrollToIndex, scrollToOffset, scrollToEnd } = makeListRef();
	const idsRef = makeMessagesIdsRef(initialRows.map(r => r.id));

	const utils = renderHook(
		({ rows, highTs = null }: { rows: Row[]; highTs?: number | null }) => {
			// Keep the ids ref in sync the same way useMessages does (before paint).
			idsRef.current = rows.map(r => r.id);
			return useScroll({
				listRef,
				messages: rows as unknown as TAnyMessageModel[],
				messagesIds: idsRef,
				highTs,
				setHighTs,
				fetchMessages
			});
		},
		{ initialProps: { rows: initialRows, highTs: initialHighTs } }
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

	it('grows the window (bounded) for a deep anchored target, then scrolls once it appears', async () => {
		const setHighTs = jest.fn();
		const fetchMessages = jest.fn(() => Promise.resolve());
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
		const fetchMessages = jest.fn(() => Promise.resolve());
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
		const fetchMessages = jest.fn(() => Promise.resolve());
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
		const fetchMessages = jest.fn(() => Promise.resolve());
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

	it('jump-to-bottom from an anchored window releases the anchor, then scrolls to the end once the live window emits', () => {
		const setHighTs = jest.fn();
		const { result, rerender, scrollToEnd } = renderUseScroll(
			[{ id: 'anchored-1' }, { id: 'anchored-2' }],
			setHighTs,
			undefined,
			1500
		);

		act(() => {
			result.current.jumpToBottom();
		});

		expect(setHighTs).toHaveBeenCalledWith(null);
		expect(scrollToEnd).not.toHaveBeenCalled();

		act(() => {
			rerender({ rows: [{ id: 'live-1' }, { id: 'live-2' }], highTs: null });
		});
		expect(scrollToEnd).toHaveBeenCalledTimes(1);
		expect(scrollToEnd).toHaveBeenLastCalledWith({ animated: false });
	});

	it('jump-to-bottom in a live window scrolls to the end immediately without re-anchoring', () => {
		const setHighTs = jest.fn();
		const { result, scrollToEnd } = renderUseScroll([{ id: 'a' }, { id: 'b' }], setHighTs, undefined, null);

		act(() => {
			result.current.jumpToBottom();
		});

		expect(setHighTs).not.toHaveBeenCalled();
		expect(scrollToEnd).toHaveBeenCalledWith({ animated: true });
	});

	it('scrolls to the oldest-first list index of a newest-first message id', () => {
		const setHighTs = jest.fn();
		const { result, scrollToIndex } = renderUseScroll(
			[{ id: 'newest' }, { id: 'target' }, { id: 'mid' }, { id: 'oldest' }],
			setHighTs
		);

		act(() => {
			result.current.jumpToMessage('target', null);
		});

		expect(scrollToIndex).toHaveBeenCalledWith(expect.objectContaining({ index: 2, viewPosition: 0.5, viewOffset: 100 }));
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

	it('cancelJumpToMessage is a safe no-op when no jump is pending', () => {
		const setHighTs = jest.fn();
		const { result, scrollToIndex } = renderUseScroll([{ id: 'a' }, { id: 'b' }], setHighTs);

		act(() => {
			result.current.cancelJumpToMessage();
		});

		expect(scrollToIndex).not.toHaveBeenCalled();
		expect(setHighTs).not.toHaveBeenCalled();
	});

	it('cancelJumpToMessage aborts a pending unscrolled jump: releases the anchor, resolves, and disarms the safety timer', async () => {
		const setHighTs = jest.fn();
		const { result, scrollToIndex } = renderUseScroll([{ id: 'live-1' }, { id: 'live-2' }], setHighTs);

		let jumpResolved = false;
		act(() => {
			result.current.jumpToMessage('target', 1500).then(() => {
				jumpResolved = true;
			});
		});

		// Anchor set; target not present yet.
		expect(setHighTs).toHaveBeenCalledWith(1500);
		setHighTs.mockClear();

		// Cancel while the jump is pending and has not yet scrolled.
		act(() => {
			result.current.cancelJumpToMessage();
		});

		// Promise resolves (abortJump called resolve()).
		await waitFor(() => expect(jumpResolved).toBe(true));
		// Anchor released back to the Live Tail.
		expect(setHighTs).toHaveBeenCalledWith(null);
		// No scroll ever happened.
		expect(scrollToIndex).not.toHaveBeenCalled();

		// Safety timer was disarmed: elapsing past the original budget must not trigger a second release.
		setHighTs.mockClear();
		act(() => {
			jest.advanceTimersByTime(5000);
		});
		expect(setHighTs).not.toHaveBeenCalled();
	});

	it('sets highlightedMessageId on jump completion and clears it automatically after HIGHLIGHT_TIMEOUT', async () => {
		const setHighTs = jest.fn();
		const { result, rerender } = renderUseScroll([{ id: 'live-1' }, { id: 'live-2' }], setHighTs);

		act(() => {
			result.current.jumpToMessage('target', 1500);
		});

		// Target appears: the layout effect fires, scrolls, and completes the jump.
		act(() => {
			rerender({ rows: [{ id: 'older' }, { id: 'target' }, { id: 'newer' }] });
		});

		// Highlight is set on completion.
		await waitFor(() => expect(result.current.highlightedMessageId).toBe('target'));

		// After HIGHLIGHT_TIMEOUT the highlight clears automatically.
		act(() => {
			jest.advanceTimersByTime(5000);
		});
		await waitFor(() => expect(result.current.highlightedMessageId).toBeNull());
	});
});
