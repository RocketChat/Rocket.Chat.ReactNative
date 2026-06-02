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

const renderUseScroll = (initialRows: Row[], setHighTs = jest.fn()) => {
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
				setHighTs
			});
		},
		{ initialProps: { rows: initialRows } }
	);

	return { ...utils, listRef, scrollToIndex, scrollToOffset, scrollToEnd, idsRef, setHighTs };
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
		scrollToIndex.mockClear();

		// Simulate the inverted list failing to measure the target's frame: it only measured up to index 1.
		act(() => {
			result.current.handleScrollToIndexFailed({
				index: 3,
				highestMeasuredFrameIndex: 1,
				averageItemLength: 50
			});
		});

		// It must retry toward the ACTUAL target index (3), not highestMeasuredFrameIndex (1).
		expect(scrollToIndex).toHaveBeenCalledTimes(1);
		expect(scrollToIndex).toHaveBeenCalledWith(expect.objectContaining({ index: 3 }));
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
